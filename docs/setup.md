# Setup de agentes

Registro da adoção do [Vibe Coding Toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit) (prompt 12, projeto existente) neste repositório.

- **Revisão do toolkit:** `de66fe3` (main, 18/10/2026).
- **Cliente:** Claude Code (local e nuvem). Codex não é usado, então não há `.codex/`.
- **Escopo:** tudo no projeto (versionado). Sessões na nuvem são efêmeras, então nada depende de instalação global feita à mão.
- **Stack preservada:** Next.js 16.4.2 + Turbopack, Supabase sem ORM, npm. Os defaults do toolkit (Drizzle, Pino) não se aplicam: o projeto já decidiu por Supabase direto e não tem logger de servidor.

## Mapa de documentos

O toolkit sugere nove documentos. Os que já tinham fonte canônica ficaram onde estavam:

| Destino do toolkit | Aqui |
|---|---|
| `README.md` | `README.md` (existente) |
| `PRODUCT.md` | `docs/ARQUITETURA.md` §5 (MVP) e §7 (telas) |
| `AGENTS.md` / `CLAUDE.md` | criados; `CLAUDE.md` importa `AGENTS.md` |
| `docs/architecture.md` | `docs/ARQUITETURA.md` §1–4 e §9 |
| `docs/design.md` | `docs/ARQUITETURA.md` §6 |
| `docs/onboarding.md` | `README.md` (Rodar local, Ligar o Supabase) |
| `docs/quality.md` | criado |
| `docs/setup.md` | este arquivo |

## Matriz de cobertura

Status: **validado** (rodou aqui), **configurado** (arquivo no lugar, sem execução real), **bloqueado** (com a condição para destravar), **não se aplica**.

| Componente | Decisão | Status | Evidência / pendência |
|---|---|---|---|
| Superpowers | skills em `.claude/skills` + hook de sessão | validado | Hook gera o contexto; skills aparecem na sessão |
| Ponytail | skills `ponytail`, `-review`, `-audit`, `-debt`; nível `full` no `AGENTS.md` | configurado | Sem os hooks do plugin (barra/ledger), que dependem de instalação local; `ponytail-help` e `ponytail-gain` ficaram de fora por descreverem só esses recursos |
| Caveman | skill `caveman`; estilo no `AGENTS.md` | configurado | Sem os hooks do plugin (modo persistente e estatística) |
| RTK | não instalado | não se aplica | Binário + hook por máquina; na nuvem o container some a cada sessão. Instalar localmente se quiser, seguindo o guia 03 |
| Context7 | MCP `context7` em `.mcp.json` + skill `find-docs` | bloqueado | A política de rede do ambiente de nuvem nega `mcp.context7.com` e `context7.com`. Destrava liberando esses domínios no ambiente |
| Graphify | não instalado | não se aplica | ~10 mil linhas de código; `grep` e a estrutura por domínio bastam. Rever se o código crescer muito |
| Skills Vercel + `find-skills` | as 8 web + `find-skills` | validado | Descobertas na sessão; `react-native-skills` fora (app é web) |
| `next-dev-loop` | skill + `agent-browser` instalado pelo hook de nuvem | validado | Next 16.4.2 com Turbopack atende o mínimo 16.3; com `next dev`, `/_next/mcp` listou as ferramentas e `agent-browser 0.39.1` leu a Home (modo demonstração) usando o Chromium do Playwright |
| `next-bundle-optimizer` | skill | configurado | Usar quando houver rota pesada; não rodou auditoria |
| `supabase-postgres-best-practices` / `supabase` | skills | validado | Descobertas na sessão |
| `gh-fix-ci` | não instalado | não se aplica | É fluxo do Codex; no Claude Code o conserto de CI já é feito pelos PRs |
| `differential-review` | skill + agente `adversarial-modeler` em `.claude/agents` | configurado | Nome do agente ajustado para o formato sem namespace |
| Prompt de segurança | `docs/prompts/security-review.md` | configurado | Bloco copiado sem alterações da revisão `de66fe3` |
| `shadcn` | skill | não se aplica (por ora) | O projeto tem design system próprio em `src/components/ui`; não adotar shadcn só por causa da skill |
| Sentry MCP | não configurado | não se aplica | O app não usa Sentry |
| agent-browser | skill + CLI via hook de nuvem | validado | Ver `next-dev-loop` |
| Chrome DevTools MCP | não configurado | não se aplica | `agent-browser` e `webapp-testing` (Playwright) cobrem console e navegação no container |
| Memória | instruções versionadas (`AGENTS.md`, docs) | configurado | A memória do Claude no projeto está desligada nas configurações do dono; o que precisa durar fica nos docs |
| Obsidian | não | não se aplica | Sem necessidade concreta |
| Skills de artefatos da Anthropic | `webapp-testing`, `mcp-builder` | validado | Descobertas na sessão |
| Firecrawl (pedido à parte) | MCP + 3 skills | bloqueado | Rede nega `mcp.firecrawl.dev`; depois de liberar, conectar uma conta Firecrawl em `/mcp` |
| ESLint quality gates | perfil Next leve + autoteste + perfil tipado | validado | Ver [`docs/quality.md`](quality.md#adoção-medida-em-18102026) |
| Hooks do cliente | `superpowers-session-start.sh`, `cloud-setup.sh` | validado | Sem hooks de Git, conforme o toolkit |
| Avaliação do harness (prompt 14) | não rodada | pendente | Precisa de sessões novas e descartáveis; rodar quando quiser medir o comportamento |

## Delegação

Subagentes usam o modelo da sessão. Delegar só com tarefa independente, arquivos disjuntos e critério de aceite claro (ver `AGENTS.md`).

## Como atualizar ou repetir

1. Clone o toolkit numa pasta temporária e anote a revisão nova.
2. Rode de novo o prompt 12 apontando para essa revisão. Ele deve preservar as decisões acima e não duplicar skills, hooks ou servidores MCP.
3. Skills: copie de novo a pasta da skill a partir da origem listada em `.claude/README.md`, revise o diff e rode `npm run check`.
4. Regras de lint: copie `eslint-rules/` e `scripts/verify-quality-rules.mjs` da mesma revisão e rode `npm run lint:rules`.
5. Atualize este arquivo com a data, a revisão e o que mudou.

Gatilhos para rever: Next.js mudar de major, adoção de shadcn/ui ou Sentry, código passar de ~30 mil linhas (Graphify), liberação de rede para Context7/Firecrawl.
