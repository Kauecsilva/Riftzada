# Qualidade

O que cada check prova e como revisar. Comandos canônicos em [`AGENTS.md`](../AGENTS.md#comandos).

## Checks

| Check | Comando | Prova | No CI |
|---|---|---|---|
| Lint | `npm run lint` | Presets `core-web-vitals` + `typescript` do Next e as regras locais `quality/*` | sim |
| Autoteste das regras locais | `npm run lint:rules` | `eslint-rules/` continua se comportando como esperado (RuleTester) | sim |
| Async com tipos | `npm run lint:typed` | Promises não esquecidas nem passadas onde se espera `void` (`src/**`) | sim |
| Tipos | `npm run typecheck` | `next typegen` + `tsc --noEmit` | sim |
| Testes de domínio | `npm test` | Regras puras em `src/lib/domain` e validações Zod | sim |
| Banco | `npm run test:sql` | Migrations + seed aplicam num Postgres 16 limpo; RLS e views batem com `tests/sql/assertions.sql` | sim (job `sql`) |
| Build | `npm run build` | O app compila para produção | sim |
| Tudo | `npm run check` | Os de cima menos o SQL (que precisa de Postgres local) | — |

Mock, SQL contra Postgres local e banco real do Supabase são evidências diferentes; diga qual rodou.

## Regras locais de lint

Vêm do [Vibe Coding Toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit) (perfil Next leve), copiadas em `eslint-rules/` com o autoteste em `scripts/verify-quality-rules.mjs`.

- `quality/max-lines`: teto de 350 linhas por arquivo (testes e barrels isentos). Arquivo grande se divide por responsabilidade real, não por número.
- `@typescript-eslint/no-floating-promises` (erro) e `no-misused-promises` (aviso), no `eslint.typed.config.mjs`. O perfil tipado leva ~20 s, por isso roda separado.

### Adoção (medida em 18/10/2026)

Regra nova com violação legada entra como aviso; sem violação, entra como erro. Proteções existentes não foram afrouxadas.

| Regra | Violações | Severidade | Para subir a erro |
|---|---|---|---|
| `quality/max-lines` | 1: `src/lib/demo/store.ts` (351 linhas) | aviso | Separar os blocos do modo demo (arena, mercado, decks) em arquivos próprios na próxima mudança nele |
| `no-floating-promises` | 0 | erro | — |
| `no-misused-promises` | 4: `CardPicker.tsx:34`, `CopyListButton.tsx:15` e `:37`, `ImageInput.tsx:95` | aviso | Envolver os handlers async (`onClick={() => void copy()}`) ou tratar o erro |

Não esconda violação com `eslint-disable` genérico, ignore amplo ou teto maior.

## Revisão

- Mudança não trivial ganha revisão independente quando disponível (`requesting-code-review`, `ponytail-review`), olhando o diff exato, quem chama, contratos e testes.
- A revisão termina quando os achados relevantes estão resolvidos ou com destino explícito, os checks afetados passam e os riscos que sobraram estão escritos. Nova rodada só com evidência nova, risco pendente ou pedido.
- UI: `web-design-guidelines` e, quando der, conferir no app rodando (`next-dev-loop` ou `webapp-testing`) em 360, 390, 768 e 1440 px.

## Segurança

- Mudança sensível (auth, RLS, storage, Server Actions, dados de contato): `differential-review` com o intervalo exato do diff.
- Revisão geral do repositório: [`docs/prompts/security-review.md`](prompts/security-review.md). Por padrão só lê, não corrige, e o relatório fica fora do repositório (achado sensível não vai para doc pública nem para PR).
- Nada de varredura em produção, teste de credencial ou upload de código para serviço externo sem pedido.
- Nenhum achado significa só que nada se confirmou no escopo lido.
