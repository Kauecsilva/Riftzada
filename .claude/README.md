# Skills de agentes do projeto

Skills vendorizadas para que toda sessão do Claude Code (local ou na nuvem) neste repositório as carregue automaticamente. Instaladas em 2026-10-17 a partir de:

| Origem | Skills |
| --- | --- |
| [vercel-labs/skills](https://github.com/vercel-labs/skills) | find-skills |
| [obra/superpowers](https://github.com/obra/superpowers) | using-superpowers, brainstorming, writing-plans, executing-plans, subagent-driven-development, dispatching-parallel-agents, test-driven-development, systematic-debugging, verification-before-completion, requesting-code-review, receiving-code-review, using-git-worktrees, finishing-a-development-branch, writing-skills, diagnosing-superpowers |
| [firecrawl/firecrawl-claude-plugin](https://github.com/firecrawl/firecrawl-claude-plugin) | firecrawl, firecrawl-developer-index, firecrawl-research-index (+ servidor MCP em `/.mcp.json`) |
| [anthropics/skills](https://github.com/anthropics/skills) | webapp-testing, mcp-builder |
| [supabase/agent-skills](https://github.com/supabase/agent-skills) | supabase, supabase-postgres-best-practices |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | vercel-react-best-practices, vercel-composition-patterns, vercel-react-view-transitions, web-design-guidelines, writing-guidelines, deploy-to-vercel, vercel-cli-with-tokens, vercel-optimize |
| [anthropics/claude-code](https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design) | frontend-design |
| [shadcn-ui/ui](https://ui.shadcn.com/docs/skills) | shadcn |
| [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) @ 5.3.2 | ponytail, ponytail-review, ponytail-audit, ponytail-debt |
| [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) @ 4.0.1 | caveman |
| [vercel/next.js](https://github.com/vercel/next.js/tree/canary/skills) (canary `bb63c72`) | next-dev-loop, next-bundle-optimizer |
| [trailofbits/skills](https://github.com/trailofbits/skills/tree/main/plugins/differential-review) | differential-review (+ agente `../agents/adversarial-modeler.md`) |
| [upstash/context7](https://github.com/upstash/context7) | find-docs |
| [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) | agent-browser (o CLI é instalado na nuvem por `hooks/cloud-setup.sh`) |

As linhas de Ponytail em diante vieram da adoção do [Vibe Coding Toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit) em 18/10/2026; decisões e pendências em `docs/setup.md`.

Observações:

- `react-native-skills` (vercel-labs/agent-skills) ficou de fora porque o app é web (Next.js).
- O plugin superpowers injeta a skill `using-superpowers` no início de cada sessão; isso é feito por `hooks/superpowers-session-start.sh`, registrado em `settings.json`. As referências `superpowers:<nome>` foram trocadas por `<nome>`, já que aqui as skills não têm o prefixo do plugin.
- As skills do Firecrawl chamam o MCP hospedado do Firecrawl, que exige conectar uma conta Firecrawl (`/mcp` no Claude Code).

Para atualizar, copie de novo a pasta da skill a partir do repositório de origem (ou use `npx skills add <repo>` e mova o resultado para cá).
