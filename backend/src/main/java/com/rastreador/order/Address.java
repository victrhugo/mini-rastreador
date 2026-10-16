package com.rastreador.order;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class Address {

    @Column(nullable = false, length = 160)
    private String street;

    @Column(nullable = false, length = 20)
    private String number;

    @Column(length = 120)
    private String complement;

    @Column(nullable = false, length = 120)
    private String district;

    @Column(nullable = false, length = 120)
    private String city;

    @Column(name = "zip_code", nullable = false, length = 9)
    private String zipCode;

    protected Address() {
    }

    public Address(String street, String number, String complement, String district, String city, String zipCode) {
        this.street = street;
        this.number = number;
        this.complement = complement;
        this.district = district;
        this.city = city;
        this.zipCode = zipCode;
    }

    public String getStreet() {
        return street;
    }

    public String getNumber() {
        return number;
    }

    public String getComplement() {
        return complement;
    }

    public String getDistrict() {
        return district;
    }

    public String getCity() {
        return city;
    }

    public String getZipCode() {
        return zipCode;
    }
}
