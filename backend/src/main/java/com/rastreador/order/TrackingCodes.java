package com.rastreador.order;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Gera os códigos dos links públicos de rastreio: 96 bits aleatórios (SecureRandom),
 * o que torna inviável descobrir o link de outro pedido por tentativa.
 */
final class TrackingCodes {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();

    private TrackingCodes() {
    }

    static String generate() {
        byte[] bytes = new byte[12];
        RANDOM.nextBytes(bytes);
        return ENCODER.encodeToString(bytes);
    }
}
