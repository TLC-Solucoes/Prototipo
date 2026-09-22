# Chatbot de diagnóstico — TLC Soluções

Página única onde um visitante conversa com um consultor de IA que descobre a dor de
automação do negócio dele e captura o contato. O bot não orça: a proposta é montada
pelo time a partir do que foi coletado.

## Rodar

```bash
npm install
npx vercel env pull .env.local
npm run db:migrate
npm run dev
```

`npm run db:migrate` aplica `db/schema.sql` e precisa rodar antes do primeiro deploy, e
de novo sempre que o schema mudar.

## Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `AGENT_CHAT_URL` | URL de stream do agente, incluindo o uuid do agente |
| `AGENT_API_KEY` | credencial do agente, enviada no header `x-api-key` |
| `DATABASE_URL` | Neon |
| `ADMIN_PASSWORD` | Basic Auth do painel; gere com `openssl rand -hex 24` |
| `IP_HASH_SALT` | salt do hash de IP; sem ela a aplicação recusa atender |
| `CHAT_PAUSADO` | qualquer valor desliga o chat e a extração; `0`, `false`, `off` e vazio mantêm ligado |
| `MAX_CONVERSAS_HORA` | teto global de conversas novas por hora; 60 se ausente |

`ADMIN_PASSWORD` é a defesa inteira do painel: não há limite de tentativas no
`proxy.ts`, então senha curta é senha quebrada.

`CHAT_PAUSADO` é o desligamento de emergência — muda no painel da Vercel e vale no
próximo request, sem deploy.

## Testes

```bash
npm test
```

## Documentação

- Design: `docs/specs/2026-09-21-chatbot-vendas-design.md`
- Plano de implementação: `docs/plans/2026-09-21-chatbot-implementacao.md`

As regras de negócio (persona, roteiro de diagnóstico, ICP, precificação) ficam fora
deste repositório, na pasta `docs/` do workspace.
