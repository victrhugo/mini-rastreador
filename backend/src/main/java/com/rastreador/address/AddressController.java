package com.rastreador.address;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;

@RestController
@RequestMapping("/api/address")
public class AddressController {

    private final CepService cepService;

    public AddressController(CepService cepService) {
        this.cepService = cepService;
    }

    @GetMapping("/cep/{cep}")
    @Operation(summary = "Busca o endereço de um CEP",
            description = "Consulta a ViaCEP, com a BrasilAPI como reserva. 404 se o CEP não existir, "
                    + "503 se nenhum serviço responder.")
    public AddressLookup byCep(@PathVariable String cep) {
        return cepService.lookup(CepService.normalize(cep));
    }
}
