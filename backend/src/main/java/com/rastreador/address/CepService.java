package com.rastreador.address;

import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.rastreador.common.BadRequestException;
import com.rastreador.common.NotFoundException;
import com.rastreador.common.ServiceUnavailableException;

/**
 * Consulta endereços pelo CEP. Usa a ViaCEP e, se ela falhar ou passar do tempo,
 * tenta a BrasilAPI. Resultados encontrados ficam em cache, porque CEP quase não muda.
 */
@Service
public class CepService {

    private static final Logger log = LoggerFactory.getLogger(CepService.class);
    private static final Pattern CEP_FORMAT = Pattern.compile("^\\d{5}-?\\d{3}$");

    private final RestClient http;
    private final CepProperties properties;

    public CepService(RestClient cepRestClient, CepProperties properties) {
        this.http = cepRestClient;
        this.properties = properties;
    }

    /** Valida o formato e devolve só os 8 dígitos. */
    public static String normalize(String cep) {
        String value = cep == null ? "" : cep.trim();
        if (!CEP_FORMAT.matcher(value).matches()) {
            throw new BadRequestException("CEP deve ter 8 dígitos, no formato 00000-000.");
        }
        return value.replace("-", "");
    }

    /**
     * @param digits CEP com 8 dígitos (veja {@link #normalize})
     * @throws NotFoundException           se o CEP não existir
     * @throws ServiceUnavailableException se nenhum dos serviços responder
     */
    @Cacheable("cep")
    public AddressLookup lookup(String digits) {
        try {
            return fromViaCep(digits);
        } catch (RestClientException ex) {
            log.warn("ViaCEP falhou para o CEP {}, tentando a BrasilAPI: {}", digits, ex.getMessage());
        }

        try {
            return fromBrasilApi(digits);
        } catch (HttpClientErrorException.NotFound ex) {
            throw notFound();
        } catch (RestClientException ex) {
            log.warn("BrasilAPI também falhou para o CEP {}: {}", digits, ex.getMessage());
            throw new ServiceUnavailableException(
                    "Não foi possível consultar o CEP agora. Preencha o endereço manualmente.");
        }
    }

    private AddressLookup fromViaCep(String digits) {
        ViaCepResponse response = http.get()
                .uri(properties.viaCepUrl() + "/{cep}/json/", digits)
                .retrieve()
                .body(ViaCepResponse.class);

        // A ViaCEP responde 200 com {"erro": true} (ou "true") quando o CEP não existe.
        if (response == null || response.notFound()) {
            throw notFound();
        }
        return new AddressLookup(format(digits), clean(response.logradouro()), clean(response.bairro()),
                clean(response.localidade()), clean(response.uf()));
    }

    private AddressLookup fromBrasilApi(String digits) {
        BrasilApiResponse response = http.get()
                .uri(properties.brasilApiUrl() + "/{cep}", digits)
                .retrieve()
                .body(BrasilApiResponse.class);

        if (response == null) {
            throw notFound();
        }
        return new AddressLookup(format(digits), clean(response.street()), clean(response.neighborhood()),
                clean(response.city()), clean(response.state()));
    }

    private static NotFoundException notFound() {
        return new NotFoundException("CEP não encontrado.");
    }

    private static String format(String digits) {
        return digits.substring(0, 5) + "-" + digits.substring(5);
    }

    private static String clean(String value) {
        return value == null ? "" : value.trim();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ViaCepResponse(String logradouro, String bairro, String localidade, String uf, Object erro) {

        boolean notFound() {
            return erro != null && !"false".equalsIgnoreCase(String.valueOf(erro));
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record BrasilApiResponse(String street, String neighborhood, String city, String state) {
    }
}
