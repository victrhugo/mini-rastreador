# Mini Rastreador de Pedidos

Versão simplificada de um sistema de rastreamento de pedidos de delivery. Um operador
autenticado cadastra pedidos e acompanha cada um pelas etapas, do recebimento à entrega.

- **Back-end:** Java 21, Spring Boot 4, Spring Security (JWT), Spring Data JPA, Flyway, SQLite
- **Front-end:** React 19, TypeScript, Vite, TanStack Query, React Router, Tailwind CSS v4, Motion, Phosphor Icons

### Interface

- Painel com indicadores do dia (em andamento, em rota, entregues e vendas), busca e filtro por status
- Duas visões: **lista** e **quadro** por etapa, com botões para avançar ou cancelar o pedido direto do cartão
- Detalhe com rastreio em etapas (horário de cada uma), histórico, dados de entrega e atalho para o mapa
- Formulário de pedido com máscaras de CEP e telefone, itens dinâmicos e resumo com total ao vivo
- Tema claro, escuro ou do sistema; layout responsivo; animações respeitam `prefers-reduced-motion`

## Como rodar

### Opção rápida: Docker

Com Docker instalado, um comando sobe a API e o front:

```bash
docker compose up --build
```

Acesse <http://localhost:3000>. O nginx serve o front e encaminha `/api` para a API, e os
dados ficam no volume `db-data`. Para usar outra porta, rode `WEB_PORT=8081 docker compose
up --build`. Para apagar os dados, rode `docker compose down -v`.

### Opção local

Pré-requisitos: **Java 21+** e **Node.js 20.19+** (ou 22.12+). Maven não precisa estar
instalado, porque o projeto usa o Maven Wrapper.

#### 1. API (porta 8080)

```bash
cd backend
./mvnw spring-boot:run
```

Na primeira execução, o arquivo `backend/data/rastreador.db` é criado e o Flyway aplica o
schema. Para zerar os dados, pare a API e apague esse arquivo.

Swagger UI: <http://localhost:8080/swagger-ui.html>. Para usar, faça login em
`/api/auth/login` e cole o token no botão **Authorize**.

#### 2. Front-end (porta 5173)

```bash
cd frontend
npm install
npm run dev
```

Acesse <http://localhost:5173>, crie uma conta e comece a cadastrar pedidos. O banco começa
vazio, sem dados de exemplo. Em
desenvolvimento, o Vite encaminha `/api` para `localhost:8080`, então não é preciso
configurar nada.

### Testes

```bash
cd backend && ./mvnw test
```

```bash
cd frontend && npm test
```

- **Back-end (32):** unitários da máquina de estados (todas as 25 combinações de status) e
  do agregado `Order`; integração da API com MockMvc e SQLite em memória cobrindo cadastro,
  login, 401, validação, criação, busca, filtro, fluxo completo, transições inválidas e
  conflito de versão.
- **Front-end (24):** Vitest e Testing Library para máscaras, conversão de preço, regras de
  etapa e o componente de ações de status (só mostra o que a API permite, envia a versão,
  pede confirmação para cancelar e exibe o erro 409).

A CI no GitHub Actions ([`ci.yml`](.github/workflows/ci.yml)) roda os dois conjuntos, o
build do front e o build das imagens Docker a cada push.

### Variáveis de ambiente (opcionais)

| Variável | Padrão | Uso |
|---|---|---|
| `JWT_SECRET` | segredo de desenvolvimento | Chave HMAC do JWT (mín. 32 bytes). **Defina fora do ambiente local.** |
| `JWT_EXPIRATION` | `2h` | Validade do token |
| `DB_PATH` | `./data/rastreador.db` | Caminho do arquivo SQLite |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Origens liberadas no CORS |
| `PORT` | `8080` | Porta da API |
| `VITE_API_URL` (front) | vazio (usa o proxy) | URL base da API no build do front |

## API

Tudo fora de `/api/auth/**` exige `Authorization: Bearer <token>`. Os erros seguem o
formato `ProblemDetail` (RFC 9457).

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/register` | Cadastro (nome, e-mail, senha). Já devolve o token. |
| `POST` | `/api/auth/login` | Login com e-mail e senha |
| `GET` | `/api/orders?status=` | Lista pedidos, mais recentes primeiro (filtro opcional) |
| `GET` | `/api/orders/{id}` | Busca um pedido |
| `POST` | `/api/orders` | Cria um pedido (status inicial `RECEBIDO`) |
| `PATCH` | `/api/orders/{id}/status` | Altera o status: `{ "status": "EM_PREPARO", "version": 0 }` |

Exemplo de criação:

```json
{
  "customer": { "name": "Ana Souza", "phone": "11999990000" },
  "address": {
    "street": "Rua das Flores", "number": "100", "complement": "Apto 12",
    "district": "Centro", "city": "São Paulo", "zipCode": "01000-000"
  },
  "items": [
    { "description": "Pizza calabresa", "quantity": 2, "unitPrice": 49.90 },
    { "description": "Refrigerante 2L", "quantity": 1, "unitPrice": 8.00 }
  ]
}
```

Códigos de resposta: `400` validação, `401` sem token, token inválido ou credenciais
inválidas, `404` pedido inexistente, `409` e-mail já cadastrado, transição não permitida ou
versão desatualizada.

O campo `version` do PATCH é opcional. Quando enviado, a API só aplica a mudança se o pedido
ainda estiver naquela versão. Isso evita que um operador cancele, sem saber, um pedido que
outro operador acabou de avançar.

## Regras de status

```
RECEBIDO ──► EM_PREPARO ──► SAIU_PARA_ENTREGA ──► ENTREGUE
   │              │
   └──────────────┴──► CANCELADO
```

- O fluxo só avança, uma etapa por vez. Não é possível pular etapas nem voltar.
- O cancelamento é permitido apenas antes de o pedido sair para entrega.
- `ENTREGUE` e `CANCELADO` são finais.
- Toda mudança fica registrada no histórico (quem alterou e quando).

As regras ficam em um único lugar, o enum
[`OrderStatus`](backend/src/main/java/com/rastreador/order/OrderStatus.java). A API devolve
`allowedTransitions` em cada pedido, e o front só exibe os botões que a API permite, sem
duplicar a regra.

## Decisões de projeto

- **Visão de operador:** todos os usuários autenticados veem todos os pedidos. O "cliente"
  é um dado do pedido (quem recebe), não necessariamente quem está logado.
- **JWT stateless:** sem sessão no servidor. Senhas com BCrypt. O login responde com a
  mesma mensagem para e-mail inexistente e senha errada, para não revelar quais e-mails
  estão cadastrados.
- **Itens em texto livre:** descrição, quantidade e preço unitário, sem catálogo. O total é
  sempre calculado no back-end.
- **Dinheiro em centavos:** o SQLite guarda decimais como ponto flutuante, então os valores
  são persistidos como inteiros (centavos) e expostos como decimais na API.
- **Flyway como fonte do schema:** o `ddl-auto` do Hibernate fica desligado. A validação
  automática não funciona no SQLite, porque chaves com autoincremento precisam ser
  `INTEGER` e o Hibernate espera `BIGINT`.
- **Pool com uma conexão:** o SQLite aceita um escritor por vez, e uma conexão evita erros
  `SQLITE_BUSY`.
- **"Ao vivo" por polling:** a lista e o detalhe se atualizam a cada 5 segundos via
  TanStack Query. Para um rastreador real, o próximo passo seria SSE ou WebSocket.
- **Concorrência:** o pedido tem `@Version` (lock otimista) e o PATCH aceita a versão vista
  pelo cliente. Uma mudança feita sobre dados desatualizados recebe 409, e o front
  recarrega a tela.
- **Token de usuário removido:** o filtro JWT confere se o usuário ainda existe; se não
  existir, a requisição recebe 401 e o front encerra a sessão.
- **Token no `localStorage`:** simples e suficiente para o desafio, mas fica exposto a XSS.
  Em produção, o token iria para um cookie `HttpOnly` com `SameSite`, com refresh token.
- **Pacotes por funcionalidade** (`auth`, `order`, `user`, `common`) em vez de por camada.

### Limitações conhecidas

- SQLite atende bem a um único processo. Para produção, a troca por PostgreSQL se resume
  a driver, URL e dialeto, já que o acesso passa por JPA e Flyway.
- Sem paginação na listagem, sem papéis de usuário (admin/operador) e sem refresh token.

## Estrutura

```
backend/
  src/main/java/com/rastreador/
    auth/      cadastro, login, JWT e filtro de autenticação
    order/     agregado Order, máquina de estados, serviço e controller
    user/      entidade e repositório de usuário
    common/    exceções e handler global de erros
    config/    segurança, CORS e OpenAPI
  src/main/resources/db/migration/   migrations do Flyway
  Dockerfile   build multi-stage (JDK) e imagem final só com JRE
frontend/
  Dockerfile   build com Node e imagem final com nginx
  nginx.conf   SPA + proxy de /api para o backend
  src/
    api/         cliente HTTP e hooks do TanStack Query
    auth/        contexto de sessão e rotas protegidas
    components/  badge, progresso, linha do tempo, ações de status, editor de itens
    pages/       login, cadastro, lista, detalhe e novo pedido
.github/workflows/ci.yml   testes e builds a cada push
```

## Uso de IA

O projeto foi desenvolvido com o Claude Code, usado para discutir o produto e a
arquitetura antes de escrever código, gerar a implementação em commits incrementais e
testar o fluxo no navegador. Todas as decisões de produto (visibilidade dos pedidos, regra
de cancelamento, itens em texto livre) foram tomadas por mim durante esse processo.
