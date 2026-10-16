package com.rastreador;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class RastreadorApplication {

    public static void main(String[] args) {
        SpringApplication.run(RastreadorApplication.class, args);
    }
}
