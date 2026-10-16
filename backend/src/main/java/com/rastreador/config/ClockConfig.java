package com.rastreador.config;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ClockConfig {

    /** Relógio injetável: permite testar regras que dependem do tempo sem esperar. */
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }
}
