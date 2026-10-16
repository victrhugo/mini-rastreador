package com.rastreador;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.jayway.jsonpath.JsonPath;
import com.rastreador.auth.AuthenticatedUser;
import com.rastreador.auth.JwtService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiIntegrationTest {

    private static final String ORDER_JSON = """
            {
              "customer": { "name": "Ana Souza", "phone": "11999990000" },
              "address": { "street": "Rua das Flores", "number": "100", "complement": "Apto 12",
                           "district": "Centro", "city": "São Paulo", "state": "sp", "zipCode": "01000-000" },
              "items": [
                { "description": "Pizza calabresa", "quantity": 2, "unitPrice": 49.90 },
                { "description": "Refrigerante 2L", "quantity": 1, "unitPrice": 8.00 }
              ]
            }
            """;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JwtService jwtService;

    private static String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@teste.com";
    }

    private ResultActions register(String email, String password) throws Exception {
        return mvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"Operador","email":"%s","password":"%s"}""".formatted(email, password)));
    }

    private String registerAndGetToken() throws Exception {
        String body = register(uniqueEmail(), "segredo123")
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.token");
    }

    @Nested
    class Auth {

        @Test
        void registerReturnsTokenAndUser() throws Exception {
            String email = uniqueEmail();
            register(email, "segredo123")
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.token").isNotEmpty())
                    .andExpect(jsonPath("$.user.email").value(email));
        }

        @Test
        void duplicateEmailIsRejectedCaseInsensitive() throws Exception {
            String email = uniqueEmail();
            register(email, "segredo123").andExpect(status().isCreated());

            register(email.toUpperCase(), "segredo123")
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.detail").value("E-mail já cadastrado."));
        }

        @Test
        void invalidRegistrationReturnsFieldErrors() throws Exception {
            mvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"name":"","email":"nao-e-email","password":"123"}"""))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.name").exists())
                    .andExpect(jsonPath("$.errors.email").exists())
                    .andExpect(jsonPath("$.errors.password").exists());
        }

        @Test
        void loginWithValidCredentials() throws Exception {
            String email = uniqueEmail();
            register(email, "segredo123").andExpect(status().isCreated());

            mvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email":"%s","password":"segredo123"}""".formatted(email)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.token").isNotEmpty());
        }

        @Test
        void loginWithWrongPasswordOrUnknownEmailGivesSameError() throws Exception {
            String email = uniqueEmail();
            register(email, "segredo123").andExpect(status().isCreated());

            for (String body : new String[] {
                    """
                    {"email":"%s","password":"errada"}""".formatted(email),
                    """
                    {"email":"ninguem@teste.com","password":"segredo123"}"""}) {
                mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
                        .andExpect(status().isUnauthorized())
                        .andExpect(jsonPath("$.detail").value("E-mail ou senha inválidos."));
            }
        }

        @Test
        void disposableEmailIsRejectedOnTheEmailField() throws Exception {
            register("alguem@mailinator.com", "segredo123")
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.email").value("E-mails temporários não são aceitos."));
        }

        @Test
        void loginIsLockedAfterTooManyWrongPasswords() throws Exception {
            String email = uniqueEmail();
            register(email, "segredo123").andExpect(status().isCreated());

            for (int i = 0; i < 5; i++) {
                mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                                .content("""
                                        {"email":"%s","password":"errada"}""".formatted(email)))
                        .andExpect(status().isUnauthorized());
            }

            // Mesmo com a senha certa, o login fica bloqueado por um tempo.
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email":"%s","password":"segredo123"}""".formatted(email)))
                    .andExpect(status().isTooManyRequests())
                    .andExpect(header().exists(HttpHeaders.RETRY_AFTER))
                    .andExpect(jsonPath("$.detail", containsString("Tente novamente em 15 minutos")));
        }

        @Test
        void ordersRequireAuthentication() throws Exception {
            mvc.perform(get("/api/orders"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401));

            mvc.perform(get("/api/orders").header(HttpHeaders.AUTHORIZATION, "Bearer token-falso"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void tokenOfUserThatNoLongerExistsIsRejected() throws Exception {
            String token = jwtService.issue(new AuthenticatedUser(999_999L, "Fantasma", "x@teste.com")).token();

            mvc.perform(get("/api/orders").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    class Orders {

        private String token;

        @BeforeEach
        void login() throws Exception {
            token = registerAndGetToken();
        }

        private String bearer() {
            return "Bearer " + token;
        }

        private Integer createOrder() throws Exception {
            String body = mvc.perform(post("/api/orders")
                            .header(HttpHeaders.AUTHORIZATION, bearer())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(ORDER_JSON))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            return JsonPath.read(body, "$.id");
        }

        private ResultActions changeStatus(Integer id, String status) throws Exception {
            return mvc.perform(patch("/api/orders/{id}/status", id)
                    .header(HttpHeaders.AUTHORIZATION, bearer())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"status":"%s"}""".formatted(status)));
        }

        @Test
        void createOrderStartsAsReceived() throws Exception {
            mvc.perform(post("/api/orders")
                            .header(HttpHeaders.AUTHORIZATION, bearer())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(ORDER_JSON))
                    .andExpect(status().isCreated())
                    .andExpect(header().string(HttpHeaders.LOCATION, containsString("/api/orders/")))
                    .andExpect(jsonPath("$.status").value("RECEBIDO"))
                    .andExpect(jsonPath("$.total").value(107.80))
                    .andExpect(jsonPath("$.items.length()").value(2))
                    .andExpect(jsonPath("$.items[0].subtotal").value(99.80))
                    .andExpect(jsonPath("$.allowedTransitions[0]").value("EM_PREPARO"))
                    .andExpect(jsonPath("$.allowedTransitions[1]").value("CANCELADO"))
                    .andExpect(jsonPath("$.history.length()").value(1))
                    .andExpect(jsonPath("$.address.state").value("SP"))
                    .andExpect(jsonPath("$.stageStartedAt").isNotEmpty())
                    .andExpect(jsonPath("$.stageDeadline").isNotEmpty())
                    .andExpect(jsonPath("$.delayed").value(false))
                    .andExpect(jsonPath("$.createdBy").value("Operador"));
        }

        @Test
        void createOrderValidatesPayload() throws Exception {
            mvc.perform(post("/api/orders")
                            .header(HttpHeaders.AUTHORIZATION, bearer())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"customer":{"name":""},
                                     "address":{"street":"Rua","number":"1","district":"B","city":"C","zipCode":"123"},
                                     "items":[]}"""))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors['customer.name']").exists())
                    .andExpect(jsonPath("$.errors['address.zipCode']").exists())
                    .andExpect(jsonPath("$.errors['address.state']").exists())
                    .andExpect(jsonPath("$.errors.items").exists());
        }

        @Test
        void phoneWithUnknownAreaCodeIsRejected() throws Exception {
            mvc.perform(post("/api/orders")
                            .header(HttpHeaders.AUTHORIZATION, bearer())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(ORDER_JSON.replace("11999990000", "20999990000")))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors['customer.phone']").value("DDD 20 não existe"));
        }

        @Test
        void findByIdAndList() throws Exception {
            Integer id = createOrder();

            mvc.perform(get("/api/orders/{id}", id).header(HttpHeaders.AUTHORIZATION, bearer()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id").value(id))
                    .andExpect(jsonPath("$.customer.name").value("Ana Souza"));

            mvc.perform(get("/api/orders").header(HttpHeaders.AUTHORIZATION, bearer()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[*].id", hasItem(id)));
        }

        @Test
        void listCanFilterByStatus() throws Exception {
            Integer id = createOrder();
            changeStatus(id, "CANCELADO").andExpect(status().isOk());

            mvc.perform(get("/api/orders").param("status", "CANCELADO")
                            .header(HttpHeaders.AUTHORIZATION, bearer()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[*].id", hasItem(id)))
                    .andExpect(jsonPath("$[*].status", everyItem(is("CANCELADO"))));
        }

        @Test
        void unknownOrderReturns404() throws Exception {
            mvc.perform(get("/api/orders/999999").header(HttpHeaders.AUTHORIZATION, bearer()))
                    .andExpect(status().isNotFound());
        }

        @Test
        void fullDeliveryFlow() throws Exception {
            Integer id = createOrder();

            changeStatus(id, "EM_PREPARO").andExpect(status().isOk());
            changeStatus(id, "SAIU_PARA_ENTREGA").andExpect(status().isOk());
            changeStatus(id, "ENTREGUE")
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("ENTREGUE"))
                    .andExpect(jsonPath("$.allowedTransitions.length()").value(0))
                    .andExpect(jsonPath("$.stageDeadline").doesNotExist())
                    .andExpect(jsonPath("$.history.length()").value(4))
                    .andExpect(jsonPath("$.history[3].from").value("SAIU_PARA_ENTREGA"))
                    .andExpect(jsonPath("$.history[3].to").value("ENTREGUE"));
        }

        @Test
        void cannotCancelAfterLeavingForDelivery() throws Exception {
            Integer id = createOrder();
            changeStatus(id, "EM_PREPARO").andExpect(status().isOk());
            changeStatus(id, "SAIU_PARA_ENTREGA").andExpect(status().isOk());

            changeStatus(id, "CANCELADO")
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.detail", containsString("não é permitida")));
        }

        @Test
        void cannotSkipSteps() throws Exception {
            Integer id = createOrder();
            changeStatus(id, "ENTREGUE").andExpect(status().isConflict());
        }

        @Test
        void staleVersionIsRejected() throws Exception {
            Integer id = createOrder();

            mvc.perform(patch("/api/orders/{id}/status", id)
                            .header(HttpHeaders.AUTHORIZATION, bearer())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"status":"EM_PREPARO","version":0}"""))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.version").value(1));

            // Outro operador ainda vê a versão 0 e tenta cancelar: o pedido mudou, então 409.
            mvc.perform(patch("/api/orders/{id}/status", id)
                            .header(HttpHeaders.AUTHORIZATION, bearer())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"status":"CANCELADO","version":0}"""))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.detail", containsString("alterado por outra pessoa")));

            mvc.perform(get("/api/orders/{id}", id).header(HttpHeaders.AUTHORIZATION, bearer()))
                    .andExpect(jsonPath("$.status").value("EM_PREPARO"));
        }

        @Test
        void publicTrackingShowsProgressWithoutPersonalData() throws Exception {
            String created = mvc.perform(post("/api/orders")
                            .header(HttpHeaders.AUTHORIZATION, bearer())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(ORDER_JSON))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.trackingCode").isNotEmpty())
                    .andReturn().getResponse().getContentAsString();
            Integer id = JsonPath.read(created, "$.id");
            String code = JsonPath.read(created, "$.trackingCode");
            changeStatus(id, "EM_PREPARO").andExpect(status().isOk());

            // Sem token: a rota é pública.
            mvc.perform(get("/api/public/tracking/{code}", code))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderNumber").value(id))
                    .andExpect(jsonPath("$.status").value("EM_PREPARO"))
                    .andExpect(jsonPath("$.customerFirstName").value("Ana"))
                    .andExpect(jsonPath("$.district").value("Centro"))
                    .andExpect(jsonPath("$.history.length()").value(2))
                    .andExpect(jsonPath("$.items[0].description").value("Pizza calabresa"))
                    .andExpect(jsonPath("$.customer").doesNotExist())
                    .andExpect(jsonPath("$.street").doesNotExist())
                    .andExpect(jsonPath("$.createdBy").doesNotExist())
                    .andExpect(content().string(not(containsString("11999990000"))))
                    .andExpect(content().string(not(containsString("Rua das Flores"))));
        }

        @Test
        void unknownTrackingCodeReturns404() throws Exception {
            mvc.perform(get("/api/public/tracking/codigo-que-nao-existe"))
                    .andExpect(status().isNotFound());
        }

        @Test
        void unknownStatusValueReturns400() throws Exception {
            Integer id = createOrder();
            changeStatus(id, "VOANDO").andExpect(status().isBadRequest());
        }
    }
}
