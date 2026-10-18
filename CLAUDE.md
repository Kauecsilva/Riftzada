@AGENTS.md

## Claude Code

- Skills ficam em `.claude/skills/` (cópias versionadas; origens em `.claude/README.md`). O agente `adversarial-modeler` (usado pela `differential-review`) fica em `.claude/agents/`.
- Hooks em `.claude/settings.json`: `superpowers-session-start.sh` injeta a skill `using-superpowers` em toda sessão; `cloud-setup.sh` roda só na nuvem (`CLAUDE_CODE_REMOTE=true`) e instala `node_modules` e o CLI `agent-browser`.
- Servidor MCP do projeto em `.mcp.json`: `context7`. O Firecrawl vem do conector do claude.ai na conta do Kaue (ferramentas `mcp__Firecrawl__*`).
