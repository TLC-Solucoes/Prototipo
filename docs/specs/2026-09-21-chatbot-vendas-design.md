# Chatbot de diagnóstico — TLC Soluções

Data: 2026-09-21
Status: aprovado, pronto para plano de implementação

## Objetivo

Uma página única na web onde um visitante conversa com um consultor de IA que
descobre a dor de automação do negócio dele e captura o contato. O bot não orça e não
promete escopo — a proposta é montada pelo time depois, a partir do que foi coletado.

O produto cumpre dois papéis ao mesmo tempo: é o MVP que prova que a TLC constrói
automação com IA, e é o instrumento de coleta que alimenta a venda.

Fora de escopo: orçamento automático, pagamento, catálogo de serviços, página
institucional, blog, autenticação de visitante.

## Arquitetura

Next.js (App Router) + TypeScript + Tailwind, deploy na Vercel.

```
visitante → / (chat)
              │
              ├─ POST /api/chat ──────stream─────→ VPS (API OpenAI-compatible)
              │        ↓                                      ↑
              │   Neon Postgres                               │
              │        ↑                                      │
              └─ POST /api/summarize ──(debounce + guarda)────┘
                       ↑
                  /admin (basic auth)
```

Uma rota visível para o público (`/`) e uma interna (`/admin`). Nada mais.

### Runtime

Node, não Edge. O driver serverless do Neon roda nos dois, mas o SDK `openai` é mais
previsível em Node, e o ganho de latência do Edge é irrelevante diante do tempo que o
modelo leva para responder.

### Camadas

| Módulo | Responsabilidade | Depende de |
|---|---|---|
| `lib/llm.ts` | falar com o VPS: streaming e chamada simples | SDK `openai`, env |
| `lib/prompt.ts` | montar o system prompt a partir da persona e do roteiro | — |
| `lib/summary.ts` | tipos do resumo e parse tolerante do JSON | — |
| `lib/summarize.ts` | transformar transcript em resumo e gravá-lo | `lib/llm.ts`, `lib/db.ts` |
| `lib/summarize-guard.ts` | decidir se vale chamar o modelo | — |
| `lib/db.ts` | todas as queries; nenhum SQL fora daqui | `@neondatabase/serverless` |
| `lib/rate-limit.ts` | tetos por IP e por conversa | `lib/db.ts` |
| `lib/session.ts` | cookie httpOnly com o id da conversa | — |

O limite que importa: nenhum componente de UI conhece SQL, e nenhum módulo de `lib/`
importa React.

## Modelo de dados

```sql
create table conversation (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  ip_hash       text not null,
  status        text not null default 'aberta',
  contact_name  text,
  contact_email text,
  contact_phone text,
  summary       jsonb,
  summary_updated_at timestamptz,
  summary_input_hash text
);

create table message (
  id              bigserial primary key,
  conversation_id uuid not null references conversation(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  incomplete      boolean not null default false,
  created_at      timestamptz not null default now()
);

create index message_conversation_idx on message (conversation_id, id);
create index conversation_ip_recent_idx on conversation (ip_hash, created_at desc);
```

`status` assume `aberta` ou `com_contato`. `message.incomplete` marca resposta cujo
stream cortou no meio, para o painel não tratar um texto truncado como final. `summary` guarda o JSON descrito em
`roteiro-diagnostico.md` (segmento, dor, frequência, responsável, consequência,
ferramentas, urgência, adequação ao ICP).

Guarda-se `ip_hash` (SHA-256 do IP com salt), nunca o IP. Serve ao rate limit e não
cria um cadastro de endereço de ninguém.

### Persistência incremental

Cada mensagem é gravada assim que existe: a do usuário antes de chamar o modelo, a do
assistente ao fechar o stream. Conversa abandonada no meio continua no banco com o que
foi dito até ali.

Essa é a decisão central do protótipo. A maioria dos visitantes não chega ao estágio
de contato, e a dor contada por essa maioria é o ativo que a TLC está tentando
acumular. Salvar apenas no final descartaria justamente o caso comum.

## Fluxo da conversa

`POST /api/chat` recebe o texto do visitante e:

1. resolve a conversa pelo cookie, ou cria uma nova
2. aplica os tetos (ver Limites)
3. grava a mensagem do usuário
4. carrega o histórico e monta `[system, ...histórico]`
5. abre o stream contra o VPS e repassa ao navegador
6. ao fechar o stream, grava a resposta do assistente

Nenhuma extração acontece aqui. Enquanto o visitante conversa, a GPU do VPS atende
só a conversa.

## Extração do resumo

Chamada separada ao mesmo modelo, com o transcript inteiro e um pedido de JSON, feita
por `POST /api/summarize`. Contato sai no mesmo JSON: quando vier preenchido, grava
nas colunas de contato e move `status` para `com_contato`.

### Debounce

A extração é debounced no cliente, na borda de saída. Um timer de 45 s reinicia a cada
mensagem enviada; dispara quando o visitante para de responder, ou imediatamente se a
aba for escondida ou fechada. A chamada usa `fetch` com `keepalive: true`, que
sobrevive ao descarregamento da página.

Uma conversa de dez mensagens seguidas produz uma extração, ao final — não uma a cada
par de turnos competindo com o streaming.

### Guarda no servidor

O cliente não é confiável, então a rota decide sozinha se vale chamar o modelo. Duas
condições, ambas obrigatórias:

- passaram 60 s desde `summary_updated_at`
- o SHA-256 do transcript difere de `summary_input_hash`

Falhando qualquer uma, a rota responde sem tocar no modelo. Bater em `/api/summarize`
em loop custa uma query, não uma inferência.

### Conversas sem resumo

Um navegador que morre sem disparar nada deixa transcript salvo e resumo defasado. O
painel mostra essas conversas marcadas como desatualizadas, com um botão que gera o
resumo na hora.

A GPU trabalha quando alguém vai de fato ler o lead. Conversa de curioso que ninguém
abre nunca consome inferência nenhuma.

### Sem tool calling

Suporte a function calling varia entre modelos abertos e entre servidores; um pedido
de JSON em texto funciona em qualquer endpoint compatível. O parser é tolerante por
consequência: aceita JSON cercado por cerca de código ou por texto solto, e um resumo
que falha a extração deixa o registro anterior intacto em vez de apagá-lo.

## Painel

`/admin`, protegido por Basic Auth em `proxy.ts` contra `ADMIN_PASSWORD`. Lista
as conversas mais recentes com data, status, contato e a dor principal do resumo;
abrir uma mostra o transcript completo e o JSON.

Conversa cujo `summary_input_hash` não bate com o transcript atual aparece marcada
como desatualizada e traz um botão que chama `/api/summarize` para aquela conversa,
ignorando o cooldown — o pedido partiu de vocês, não de um cliente anônimo.

Basic Auth é suficiente aqui: o painel não tem escrita e o protótipo tem três
usuários. Login próprio seria cerimônia sem ganho.

## Limites

| Limite | Valor | Onde |
|---|---|---|
| Conversas novas por IP | 5 por hora | `lib/rate-limit.ts` |
| Mensagens do usuário por conversa | 40 | `lib/rate-limit.ts` |
| Caracteres por mensagem | 2000 | validação na rota |
| Extrações por conversa | 1 a cada 60 s | `/api/summarize` |

Os tetos vivem no banco, não em memória — processo serverless não guarda estado entre
requisições. Ao estourar, o bot responde uma frase encerrando com educação; não
devolve erro cru.

Existem para proteger a GPU do VPS de curioso em loop, não para barrar cliente real:
nenhum diagnóstico honesto precisa de 40 mensagens.

## Configuração

| Variável | Para quê |
|---|---|
| `OPENAI_BASE_URL` | endpoint OpenAI-compatible no VPS |
| `OPENAI_API_KEY` | credencial do endpoint |
| `MODEL_NAME` | modelo da conversa |
| `MODEL_NAME_EXTRACT` | modelo da extração; cai para `MODEL_NAME` se ausente |
| `DATABASE_URL` | Neon |
| `ADMIN_PASSWORD` | Basic Auth do painel |
| `IP_HASH_SALT` | salt do hash de IP |

Usar o SDK `openai` com `baseURL` mantém o código indiferente a onde o modelo roda:
trocar o VPS por outro servidor, ou por um provider externo, é mudar duas variáveis.

## Testes

Vitest, cobrindo o que quebra em silêncio:

- parser tolerante da extração — JSON limpo, em cerca de código, cercado de texto,
  malformado, e o caso em que a falha preserva o resumo anterior
- guarda de `/api/summarize` — dentro do cooldown, fora do cooldown, hash igual, hash
  diferente, e o pedido do painel que ignora o cooldown
- montagem do system prompt — persona e roteiro presentes, histórico na ordem certa
- rate limit — dentro do teto, no teto, acima do teto
- gravação incremental — mensagem do usuário persiste mesmo se a chamada ao modelo falhar

O modelo não é testado. Comportamento de conversa se valida conversando, e é o que a
rodada manual antes do deploy faz.

## Erros

| Situação | Comportamento |
|---|---|
| VPS fora do ar ou timeout | mensagem pedindo para tentar de novo; a mensagem do usuário já está salva |
| Stream corta no meio | grava o parcial recebido e marca a mensagem como incompleta |
| Extração falha | silenciosa; `summary` e o hash anteriores permanecem, então o painel segue oferecendo gerar de novo |
| Banco indisponível | a conversa continua na tela; a perda é registrada no log da função |

A conversa nunca morre por falha de infraestrutura secundária. Só a indisponibilidade
do modelo interrompe o visitante.

## Deploy

Vercel conectada ao repo, integração Neon para `DATABASE_URL`, demais variáveis no
painel do projeto. O schema é aplicado por um script de migração rodado uma vez.

Antes de divulgar o link: uma conversa manual de ponta a ponta, confirmando que o
transcript e o resumo chegaram ao banco e aparecem no `/admin`.
