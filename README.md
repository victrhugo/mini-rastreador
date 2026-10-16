# Mini Rastreador de Pedidos

Versão simplificada de um sistema de rastreamento de pedidos de delivery. Um operador
autenticado cadastra pedidos e acompanha cada um pelas etapas, do recebimento à entrega.

- **Back-end:** Java 21, Spring Boot 4, Spring Security (JWT), Spring Data JPA, Flyway, SQLite
- **Front-end:** React 19, TypeScript, Vite, TanStack Query, React Router, Tailwind CSS v4, Motion, Phosphor Icons

### Funcionalidades

- **Tempo real:** painel e página do cliente mudam no instante em que um pedido é criado
  ou avança (Server-Sent Events), com reconexão automática
- **Link público de rastreio:** cada pedido tem um link (`/rastreio/{codigo}`) que o cliente
  abre sem login para acompanhar as etapas, sem expor dados pessoais
- **Alerta de atraso:** tempo máximo por etapa; a tela mostra há quanto tempo o pedido está
  em cada etapa e destaca os atrasados (indicador, filtro, lista, quadro e detalhe)
- **Painel do operador:** indicadores do dia, busca, filtros, visões de **lista** e
  **quadro**, e avanço ou cancelamento do pedido direto do cartão
- **Formulário de pedido:** endereço preenchido pelo CEP (ViaCEP com BrasilAPI de reserva),
  telefone com DDD validado, itens dinâmicos e resumo com total ao vivo
- **Cadastro e login:** e-mail conferido no DNS, bloqueio de e-mail temporário, sugestão de
  correção (`@gmial.com` -> `@gmail.com`) e bloqueio temporário após 5 senhas erradas
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

- **Back-end (99):** máquina de estados (todas as 25 combinações), agregado `Order`, prazos
  por etapa, telefone (DDDs e formatos), política de e-mail, bloqueio de login com relógio
  simulado (inclusive tentativas em paralelo), limite de cadastros, distribuição e limites
  de conexões SSE, consulta de CEP com servidor HTTP simulado e integração da API com
  MockMvc e SQLite em memória (cadastro, login, 401, 429, validação, CRUD, fluxo completo,
  transições inválidas, conflito de versão, rastreio público sem dados pessoais e streams).
- **Front-end (63):** Vitest e Testing Library para máscaras, preço, regras de etapa, prazos,
  sugestão de e-mail, telefone, leitura do stream SSE, busca de CEP e o componente de ações
  de status (só mostra o que a API permite, envia a versão, confirma o cancelamento e exibe
  o erro 409), além de um teste que garante que a CSP do nginx libera o script do `index.html`.

A CI no GitHub Actions ([`ci.yml`](.github/workflows/ci.yml)) roda os dois conjuntos, o
build do front e o build das imagens Docker a cada push.

### Variáveis de ambiente (opcionais)

| Variável | Padrão | Uso |
|---|---|---|
| `JWT_SECRET` | vazio (chave aleatória) | Chave HMAC do JWT (mín. 32 bytes). Sem ela, a API gera uma chave a cada inicialização e os logins expiram ao reiniciar. **Defina em produção.** |
| `SWAGGER_ENABLED` | `true` | Liga a documentação em `/swagger-ui.html` |
| `JWT_EXPIRATION` | `2h` | Validade do token |
| `DB_PATH` | `./data/rastreador.db` | Caminho do arquivo SQLite |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Origens liberadas no CORS |
| `VIACEP_URL` | `https://viacep.com.br/ws` | Consulta de CEP (principal) |
| `BRASILAPI_URL` | `https://brasilapi.com.br/api/cep/v1` | Consulta de CEP (reserva) |
| `CEP_TIMEOUT` | `3s` | Tempo máximo de cada consulta de CEP |
| `EMAIL_CHECK_DOMAIN` | `true` | Confere no DNS se o domínio do e-mail recebe mensagens |

Os limites de tempo por etapa ficam em `app.sla.limits` no `application.yml` (10 min em
Recebido, 30 em Em preparo, 45 em Saiu para entrega). Para ver o alerta de atraso sem
esperar, suba a API com um limite curto:

```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments=--app.sla.limits.RECEBIDO=1m
```
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
| `GET` | `/api/orders/stream` | Eventos em tempo real (SSE) de pedidos criados ou alterados |
| `GET` | `/api/address/cep/{cep}` | Endereço de um CEP (ViaCEP, com BrasilAPI de reserva) |
| `GET` | `/api/public/tracking/{codigo}` | Rastreio público do pedido, **sem login** |
| `GET` | `/api/public/tracking/{codigo}/stream` | Eventos em tempo real do pedido, **sem login** |

Exemplo de criação:

```json
{
  "customer": { "name": "Ana Souza", "phone": "11999990000" },
  "address": {
    "street": "Rua das Flores", "number": "100", "complement": "Apto 12",
    "district": "Centro", "city": "São Paulo", "state": "SP", "zipCode": "01000-000"
  },
  "items": [
    { "description": "Pizza calabresa", "quantity": 2, "unitPrice": 49.90 },
    { "description": "Refrigerante 2L", "quantity": 1, "unitPrice": 8.00 }
  ]
}
```

Códigos de resposta: `400` validação, `401` sem token, token inválido ou credenciais
inválidas, `404` pedido, CEP ou código de rastreio inexistente, `409` e-mail já cadastrado,
transição não permitida ou versão desatualizada, `429` login bloqueado por excesso de
tentativas (com `Retry-After`), `503` serviços de CEP fora do ar.

Cada pedido também traz `trackingCode` (link público), `stageStartedAt` (quando entrou na
etapa atual), `stageDeadline` (prazo da etapa) e `delayed`.

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
- **Tempo real com SSE, não WebSocket:** o fluxo é só do servidor para o navegador, e SSE
  resolve isso sobre HTTP comum, com reconexão nativa. Os eventos saem depois do commit
  da transação (`@TransactionalEventListener`), então ninguém recebe aviso de algo que foi
  desfeito. O painel abre o stream com `fetch` para poder enviar o token; a página pública
  usa `EventSource`. Uma consulta a cada 30 segundos fica como reserva.
- **Link de rastreio:** código aleatório de 96 bits (`SecureRandom`), inviável de adivinhar.
  A resposta pública leva só primeiro nome, bairro, cidade, itens, total e etapas.
- **Prazos por etapa no back-end:** como as transições, a regra fica na API, que devolve o
  prazo; o front só exibe e recalcula com o relógio para o alerta aparecer sem nova consulta.
- **E-mail sem API externa:** o domínio precisa ter servidor de e-mail (registro MX),
  conferido no DNS pelo próprio JDK; "MX nulo" (`0 .`) conta como sem e-mail. Domínios a
  até duas letras de um provedor conhecido (`gmial.com`, `hotmial.com`) são recusados com
  sugestão, porque muitos existem de verdade para capturar e-mails digitados errado. Se o
  DNS não responder, o cadastro segue; só é bloqueado o domínio que comprovadamente não
  recebe e-mail. Garantir que a caixa existe exigiria e-mail de
  confirmação, fora do escopo.
- **Limites contra abuso:** login bloqueado após 5 erros por e-mail + IP (sem permitir que
  alguém bloqueie a conta de outra pessoa) e após 30 tentativas por IP (contra testar
  muitas contas); no máximo 10 cadastros por IP por hora; conexões em tempo real limitadas
  no total, por operador e por link público. Os contadores ficam em caches com validade e
  tamanho máximo (Caffeine), então a memória não cresce sem fim.
- **SQLite com uma conexão:** cadastro e login não abrem transação, para que BCrypt e DNS
  (lentos) não segurem a conexão única; os eventos de tempo real saem em um executor
  próprio, fora da thread que grava o pedido.
- **Cadastro aberto, todos veem todos os pedidos:** é o que o desafio pede (cadastro de
  usuário + acesso só para autenticados) e a visão de operador escolhida. Em produção, o
  cadastro seria por convite ou haveria papéis (operador, gerente) e escopo por loja.
- **Segurança das páginas:** o nginx envia CSP restrita, `X-Frame-Options`, `nosniff` e
  `Referrer-Policy`, e repassa à API o IP real do cliente (um `X-Forwarded-For` forjado não
  burla o limite de login).
- **Concorrência:** o pedido tem `@Version` (lock otimista) e o PATCH aceita a versão vista
  pelo cliente. Uma mudança feita sobre dados desatualizados recebe 409, e o front
  recarrega a tela.
- **Token de usuário removido:** o filtro JWT confere se o usuário ainda existe; se não
  existir, a requisição recebe 401 e o front encerra a sessão.
- **Token no `localStorage`:** simples e suficiente para o desafio, mas fica exposto a XSS.
  Em produção, o token iria para um cookie `HttpOnly` com `SameSite`, com refresh token.
- **CEP pelo back-end:** o front chama a própria API, que consulta a ViaCEP e cai para a
  BrasilAPI se a primeira falhar ou passar de 3 segundos. Assim o front não depende de
  serviços externos, a troca de provedor fica num lugar só e os resultados ficam em cache.
  Se nenhum serviço responder, o formulário avisa e o endereço pode ser preenchido à mão.
- **Pacotes por funcionalidade** (`auth`, `order`, `address`, `user`, `common`) em vez de por camada.

### Limitações conhecidas

- SQLite atende bem a um único processo. Para produção, a troca por PostgreSQL se resume
  a driver, URL e dialeto, já que o acesso passa por JPA e Flyway.
- Conexões SSE, tentativas de login e caches ficam em memória, o que basta para uma
  instância. Com várias, iriam para um armazenamento compartilhado (ex.: Redis).
- Sem paginação na listagem, sem papéis de usuário (admin/operador) e sem refresh token.
- O número do pedido (sequencial) aparece na página pública, como em apps de delivery.

## Estrutura

```
backend/
  src/main/java/com/rastreador/
    auth/      cadastro, login, JWT e filtro de autenticação
    order/     agregado Order, máquina de estados, serviço e controller
    order/stream/  eventos em tempo real (SSE)
    address/   consulta de CEP (ViaCEP com BrasilAPI de reserva) e cache
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
    hooks/       busca de CEP, eventos em tempo real e relógio
    validation/  sugestão de e-mail e telefone
    components/  badge, progresso, linha do tempo, ações de status, editor de itens
    pages/       login, cadastro, lista, detalhe, novo pedido e rastreio público
.github/workflows/ci.yml   testes e builds a cada push
```
