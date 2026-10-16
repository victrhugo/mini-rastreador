package com.rastreador.order.stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.rastreador.common.TooManyRequestsException;
import com.rastreador.order.OrderStatus;

class OrderStreamServiceTest {

    /** Emitter que guarda o texto enviado em vez de escrever numa resposta HTTP. */
    static class RecordingEmitter extends SseEmitter {
        final List<String> sent = new ArrayList<>();
        boolean completed;

        @Override
        public void complete() {
            completed = true;
        }

        @Override
        public void send(SseEventBuilder builder) {
            StringBuilder text = new StringBuilder();
            builder.build().forEach(part -> text.append(part.getData()));
            sent.add(text.toString());
        }

        boolean received(String fragment) {
            return sent.stream().anyMatch(message -> message.contains(fragment));
        }
    }

    private final OrderStreamService service = new OrderStreamService(new StreamProperties(5, 2, 2));

    @Test
    void connectionStartsWithReadyEvent() {
        RecordingEmitter operator = new RecordingEmitter();
        service.registerOperator(operator, 1L);

        assertThat(operator.received("event:ready")).isTrue();
    }

    @Test
    void operatorsReceiveEveryChange() {
        RecordingEmitter operator = new RecordingEmitter();
        service.registerOperator(operator, 1L);

        service.onOrderChanged(new OrderChangedEvent(7L, "abc", OrderStatus.EM_PREPARO, 1));

        assertThat(operator.sent.getLast())
                .contains("event:order")
                .contains("id=7")
                .contains("status=EM_PREPARO")
                .contains("version=1");
    }

    @Test
    void trackingPageOnlyReceivesItsOwnOrder() {
        RecordingEmitter mine = new RecordingEmitter();
        RecordingEmitter other = new RecordingEmitter();
        service.registerTracking(mine, "abc");
        service.registerTracking(other, "xyz");

        service.onOrderChanged(new OrderChangedEvent(7L, "abc", OrderStatus.SAIU_PARA_ENTREGA, 2));

        assertThat(mine.sent).hasSize(2);
        assertThat(mine.sent.getLast()).contains("status=SAIU_PARA_ENTREGA").doesNotContain("id=");
        assertThat(other.sent).hasSize(1); // só o "ready"
    }

    @Test
    void failingConnectionDoesNotAffectOthers() {
        SseEmitter broken = new SseEmitter() {
            @Override
            public void send(SseEventBuilder builder) throws IOException {
                throw new IOException("cliente saiu");
            }
        };
        RecordingEmitter healthy = new RecordingEmitter();
        service.registerOperator(broken, 1L);
        service.registerOperator(healthy, 2L);

        service.onOrderChanged(new OrderChangedEvent(7L, "abc", OrderStatus.ENTREGUE, 3));

        assertThat(healthy.received("status=ENTREGUE")).isTrue();
    }

    @Test
    void finalStatusClosesTheTrackingStreams() {
        RecordingEmitter mine = new RecordingEmitter();
        service.registerTracking(mine, "abc");

        service.onOrderChanged(new OrderChangedEvent(7L, "abc", OrderStatus.ENTREGUE, 4));

        assertThat(mine.received("status=ENTREGUE")).isTrue();
        assertThat(mine.completed).isTrue();
    }

    @Test
    void limitsConnectionsPerTrackingCodePerOperatorAndInTotal() {
        service.registerTracking(new RecordingEmitter(), "abc");
        service.registerTracking(new RecordingEmitter(), "abc");
        assertThatThrownBy(() -> service.registerTracking(new RecordingEmitter(), "abc"))
                .isInstanceOf(TooManyRequestsException.class);

        service.registerOperator(new RecordingEmitter(), 1L);
        service.registerOperator(new RecordingEmitter(), 1L);
        assertThatThrownBy(() -> service.registerOperator(new RecordingEmitter(), 1L))
                .isInstanceOf(TooManyRequestsException.class);

        service.registerOperator(new RecordingEmitter(), 2L); // 5ª conexão: chega ao total
        assertThatThrownBy(() -> service.registerTracking(new RecordingEmitter(), "xyz"))
                .isInstanceOf(TooManyRequestsException.class);
        assertThat(service.connectionCount()).isEqualTo(5);
    }
}
