# Riftzada — instruções para agentes

App web mobile-first (PWA) da comunidade local de Riftbound. Escopo, telas, arquitetura, banco, design system e riscos: [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md). Rodar e ligar o Supabase: [`README.md`](README.md).

## Stack

Next.js 16 (App Router, Turbopack, Server Actions) · React 19 · TypeScript estrito · Tailwind CSS 4 · Supabase (Postgres + RLS, Auth, Storage) · Zod · Vitest · npm · Node ≥ 22.18 · deploy na Vercel.

## Comandos

- Instalar: `npm ci`
- Desenvolver: `npm run dev` (sem `.env.local` abre em modo demonstração)
- Lint: `npm run lint` · regras locais: `npm run lint:rules` · async com tipos: `npm run lint:typed`
- Tipos: `npm run typecheck`
- Testes: `npm test` (domínio) · `npm run test:sql` (migrations, RLS e views num Postgres local)
- Build: `npm run build`
- Tudo de uma vez: `npm run check` (não publica, não migra)

O CI (`.github/workflows/ci.yml`) roda os mesmos comandos em todo PR.

## Acordos de trabalho

- Leia o código e as instruções relevantes antes de editar. Diga as suposições que mudam comportamento ou escopo.
- Faça a menor mudança que resolve o pedido por completo. Reuse componentes, queries, actions e dependências existentes.
- Preserve validação, tratamento de erro, RLS, acessibilidade e requisitos explícitos.
- Não crie abstrações, opções, dependências ou funcionalidades que ninguém pediu.
- Permissão mora no banco (RLS) e no servidor; o front nunca é a última defesa. Papel nunca vem do cliente.
- Toda entrada do usuário passa por Zod (`src/lib/validation`) na Server Action.
- Bug: reproduza, corrija na causa e deixe um teste de regressão quando for viável.
- Rode os checks afetados antes de dizer que terminou. Não transforme suposição em fato nem integração pendente em resultado simulado.
- Mudou comportamento, comando, schema ou configuração: atualize o documento responsável (ver mapa abaixo) no mesmo PR.
- Publicar, mandar mensagem a terceiros, gerar custo e ações destrutivas (migrations em produção, apagar dados) pedem autorização específica. Ter a skill instalada não autoriza.
- Trabalho que atravessa sessões: deixe um handoff curto (objetivo, estado verificado, checks, pendências, próximo passo) no PR ou no plano. Ao retomar, confira os arquivos e o Git de verdade antes de confiar nele.

## Ferramentas e estilo

- **Superpowers:** use as skills pertinentes (brainstorming, writing-plans, test-driven-development, systematic-debugging, verification-before-completion) na proporção do pedido. Instrução explícita e execução já autorizada valem mais que aprovações repetidas.
- **Ponytail** (`full`): suba a escada antes de escrever código (precisa existir? já existe aqui? stdlib? recurso nativo? dependência instalada? uma linha?). Atalho deliberado leva comentário `shortcut:` com o limite e o caminho de upgrade. `stop ponytail` desliga.
- **Caveman:** conversa curta e direta, em português; código, docs, commits e PRs com redação normal. Ações irreversíveis e perguntas ao usuário sempre em frases completas. `stop caveman` desliga.
- **Context7** (`find-docs`, MCP `context7`): consulte a doc atual de Next.js, React, Supabase, Tailwind e Zod antes de mexer em API. Uma pergunta por vez, sem segredos nem código privado. Se não responder, use a doc oficial e diga que o Context7 estava fora.
- **Subagentes:** delegue só quando isolar contexto, especializar ou paralelizar tarefas independentes compensa. Um escritor por arquivo; lockfile e configuração compartilhada ficam com o coordenador; revisores só leem. Confira o diff e os checks antes de aceitar o resultado de um worker. Sem política explícita de modelos, subagentes usam o modelo da sessão.

Confira se a skill ou o servidor está disponível antes de depender dele. Detalhe do que está instalado e do que falta: [`docs/setup.md`](docs/setup.md).

## Skills por momento

- Escrever ou revisar React/Next: `vercel-react-best-practices`; API de componente: `vercel-composition-patterns`.
- UI nova ou alterada: `frontend-design` para direção visual, `shadcn` só se o projeto adotar shadcn/ui (hoje não usa), `web-design-guidelines` para revisar acessibilidade e estados.
- Conferir no app rodando: `next-dev-loop` (dev server + `/_next/mcp` + `agent-browser`) ou `webapp-testing` (Playwright).
- Bundle pesado ou rota lenta: `next-bundle-optimizer`, com evidência do analyzer.
- Banco, migrations, RLS, SQL: `supabase` e `supabase-postgres-best-practices` antes de escrever; `npm run test:sql` depois.
- Revisão: `requesting-code-review` / `ponytail-review` para qualidade; `differential-review` e [`docs/prompts/security-review.md`](docs/prompts/security-review.md) para mudanças sensíveis (auth, RLS, storage, dados pessoais).
- Docs e textos: `writing-guidelines`. Pesquisa na web: `firecrawl` (conector do claude.ai).
- Vercel: `deploy-to-vercel` e `vercel-cli-with-tokens` só quando pedirem publicação; `vercel-optimize` com métricas reais.
- Faltou uma capacidade: `find-skills`. Criar skill nova: `writing-skills`.

Skill instalada não executa nada sozinha: nada de animação, cache, deploy ou mudança de arquitetura só porque a skill existe.

## Git e colaboração

- Sem bloqueio de push na `main`, sem exigência de branch/worktree e sem hooks de Git. Lint, tipos, testes e build são checks explícitos.
- PRs com merge automático depois do CI verde estão autorizados pelo Kaue.

## Mapa de documentos

| Assunto | Fonte |
|---|---|
| Produto, escopo, MVP e telas | `docs/ARQUITETURA.md` §5 e §7 |
| Arquitetura, pastas, banco, riscos | `docs/ARQUITETURA.md` §1–4 e §9 |
| Design system e interface | `docs/ARQUITETURA.md` §6 e tokens em `src/app/globals.css` |
| Rodar local, Supabase, deploy | `README.md` |
| Checks, lint, revisão e segurança | `docs/quality.md` |
| Ferramentas de agente, decisões e pendências | `docs/setup.md` |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
