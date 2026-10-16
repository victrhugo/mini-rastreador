package com.rastreador.order;

import com.rastreador.common.ConflictException;

/**
 * O cliente tentou alterar um pedido com base em uma versão que já mudou
 * (por exemplo, outro operador avançou o status enquanto a tela estava aberta).
 */
public class StaleOrderException extends ConflictException {

    public StaleOrderException(Long orderId) {
        super("O pedido %d foi alterado por outra pessoa. Atualize a tela e tente novamente.".formatted(orderId));
    }
}
