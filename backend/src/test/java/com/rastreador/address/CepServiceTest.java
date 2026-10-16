package com.rastreador.address;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withResourceNotFound;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.time.Duration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import com.rastreador.common.BadRequestException;
import com.rastreador.common.NotFoundException;
import com.rastreador.common.ServiceUnavailableException;

class CepServiceTest {

    private static final String VIACEP = "https://viacep.test/ws";
    private static final String BRASILAPI = "https://brasilapi.test/api/cep/v1";

    private MockRestServiceServer server;
    private CepService service;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        service = new CepService(builder.build(), new CepProperties(VIACEP, BRASILAPI, Duration.ofSeconds(1)));
    }

    @Test
    void returnsAddressFromViaCep() {
        server.expect(requestTo(VIACEP + "/01310100/json/")).andRespond(withSuccess("""
                {"cep":"01310-100","logradouro":"Avenida Paulista","bairro":"Bela Vista",
                 "localidade":"São Paulo","uf":"SP","ibge":"3550308"}""", MediaType.APPLICATION_JSON));

        assertThat(service.lookup("01310100"))
                .isEqualTo(new AddressLookup("01310-100", "Avenida Paulista", "Bela Vista", "São Paulo", "SP"));
        server.verify();
    }

    @Test
    void viaCepErrorFlagMeansNotFound() {
        server.expect(requestTo(VIACEP + "/99999999/json/"))
                .andRespond(withSuccess("{\"erro\": \"true\"}", MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> service.lookup("99999999")).isInstanceOf(NotFoundException.class);
        server.verify();
    }

    @Test
    void fallsBackToBrasilApiWhenViaCepFails() {
        server.expect(requestTo(VIACEP + "/01310100/json/")).andRespond(withServerError());
        server.expect(requestTo(BRASILAPI + "/01310100")).andRespond(withSuccess("""
                {"cep":"01310100","state":"SP","city":"São Paulo","neighborhood":"Bela Vista",
                 "street":"Avenida Paulista","service":"open-cep"}""", MediaType.APPLICATION_JSON));

        assertThat(service.lookup("01310100").street()).isEqualTo("Avenida Paulista");
        server.verify();
    }

    @Test
    void brasilApi404MeansNotFound() {
        server.expect(requestTo(VIACEP + "/01310100/json/")).andRespond(withServerError());
        server.expect(requestTo(BRASILAPI + "/01310100")).andRespond(withResourceNotFound());

        assertThatThrownBy(() -> service.lookup("01310100")).isInstanceOf(NotFoundException.class);
    }

    @Test
    void bothServicesDownMeansUnavailable() {
        server.expect(requestTo(VIACEP + "/01310100/json/")).andRespond(withServerError());
        server.expect(requestTo(BRASILAPI + "/01310100")).andRespond(withServerError());

        assertThatThrownBy(() -> service.lookup("01310100")).isInstanceOf(ServiceUnavailableException.class);
    }

    @Test
    void emptyFieldsForSingleZipCodeCities() {
        server.expect(requestTo(VIACEP + "/13870000/json/")).andRespond(withSuccess("""
                {"cep":"13870-000","logradouro":"","bairro":"","localidade":"São João da Boa Vista","uf":"SP"}""",
                MediaType.APPLICATION_JSON));

        AddressLookup result = service.lookup("13870000");
        assertThat(result.street()).isEmpty();
        assertThat(result.city()).isEqualTo("São João da Boa Vista");
    }

    @Test
    void normalizeAcceptsBothFormatsAndRejectsInvalid() {
        assertThat(CepService.normalize("01310-100")).isEqualTo("01310100");
        assertThat(CepService.normalize(" 01310100 ")).isEqualTo("01310100");
        assertThatThrownBy(() -> CepService.normalize("0131")).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> CepService.normalize("abcde-fgh")).isInstanceOf(BadRequestException.class);
    }
}
