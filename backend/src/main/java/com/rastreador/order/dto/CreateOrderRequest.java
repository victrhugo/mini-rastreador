package com.rastreador.order.dto;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateOrderRequest(
        @NotNull(message = "Cliente é obrigatório")
        @Valid
        CustomerData customer,

        @NotNull(message = "Endereço de entrega é obrigatório")
        @Valid
        AddressData address,

        @NotEmpty(message = "Pedido precisa de pelo menos um item")
        @Size(max = 50, message = "Pedido pode ter no máximo 50 itens")
        List<@NotNull @Valid ItemData> items) {

    public record CustomerData(
            @NotBlank(message = "Nome do cliente é obrigatório")
            @Size(max = 120, message = "Nome deve ter no máximo 120 caracteres")
            String name,

            @Pattern(regexp = "^\\+?[0-9 ()-]{8,20}$", message = "Telefone inválido")
            String phone) {
    }

    public record AddressData(
            @NotBlank(message = "Rua é obrigatória")
            @Size(max = 160)
            String street,

            @NotBlank(message = "Número é obrigatório")
            @Size(max = 20)
            String number,

            @Size(max = 120)
            String complement,

            @NotBlank(message = "Bairro é obrigatório")
            @Size(max = 120)
            String district,

            @NotBlank(message = "Cidade é obrigatória")
            @Size(max = 120)
            String city,

            @NotBlank(message = "CEP é obrigatório")
            @Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "CEP deve estar no formato 00000-000")
            String zipCode) {
    }

    public record ItemData(
            @NotBlank(message = "Descrição do item é obrigatória")
            @Size(max = 200)
            String description,

            @NotNull(message = "Quantidade é obrigatória")
            @Min(value = 1, message = "Quantidade deve ser pelo menos 1")
            @Max(value = 999, message = "Quantidade deve ser no máximo 999")
            Integer quantity,

            @NotNull(message = "Preço unitário é obrigatório")
            @DecimalMin(value = "0.00", message = "Preço não pode ser negativo")
            @Digits(integer = 7, fraction = 2, message = "Preço deve ter no máximo 2 casas decimais")
            BigDecimal unitPrice) {
    }
}
