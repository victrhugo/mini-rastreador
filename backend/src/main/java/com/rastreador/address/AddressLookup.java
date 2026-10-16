package com.rastreador.address;

/**
 * Endereço encontrado para um CEP. Campos podem vir vazios em cidades com CEP único,
 * onde não há rua nem bairro por CEP.
 */
public record AddressLookup(String zipCode, String street, String district, String city, String state) {
}
