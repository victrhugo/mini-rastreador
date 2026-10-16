package com.rastreador.address;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;
import com.rastreador.common.NotFoundException;
import com.rastreador.common.ServiceUnavailableException;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AddressControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private CepService cepService;

    private String bearer;

    @BeforeEach
    void login() throws Exception {
        String body = mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Operador","email":"cep-%s@teste.com","password":"segredo123"}"""
                                .formatted(UUID.randomUUID())))
                .andReturn().getResponse().getContentAsString();
        bearer = "Bearer " + JsonPath.read(body, "$.token");
    }

    @Test
    void returnsAddressForValidZipCode() throws Exception {
        when(cepService.lookup("01310100"))
                .thenReturn(new AddressLookup("01310-100", "Avenida Paulista", "Bela Vista", "São Paulo", "SP"));

        mvc.perform(get("/api/address/cep/01310-100").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.street").value("Avenida Paulista"))
                .andExpect(jsonPath("$.state").value("SP"));
        verify(cepService).lookup("01310100");
    }

    @Test
    void invalidFormatIsRejectedWithoutCallingExternalServices() throws Exception {
        mvc.perform(get("/api/address/cep/123").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(cepService);
    }

    @Test
    void unknownZipCodeReturns404() throws Exception {
        when(cepService.lookup(anyString())).thenThrow(new NotFoundException("CEP não encontrado."));

        mvc.perform(get("/api/address/cep/99999999").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("CEP não encontrado."));
    }

    @Test
    void servicesDownReturns503() throws Exception {
        when(cepService.lookup(anyString())).thenThrow(new ServiceUnavailableException("Fora do ar."));

        mvc.perform(get("/api/address/cep/01310100").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void requiresAuthentication() throws Exception {
        mvc.perform(get("/api/address/cep/01310100")).andExpect(status().isUnauthorized());
    }
}
