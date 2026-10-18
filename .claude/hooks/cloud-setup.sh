#!/usr/bin/env bash
# Prepara sessões do Claude Code na nuvem (containers efêmeros):
# dependências do app e o CLI agent-browser exigido pela skill next-dev-loop.
# Em máquina local não faz nada.
set -uo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

[ -d node_modules ] || npm ci --silent --no-audit --no-fund >/dev/null 2>&1 || echo "cloud-setup: npm ci falhou" >&2

need="0.31.1"
have="$(agent-browser --version 2>/dev/null | awk '{print $2}')"
if [ -z "$have" ] || [ "$(printf '%s\n%s\n' "$need" "$have" | sort -V | head -1)" != "$need" ]; then
  npm install -g agent-browser@latest --silent --no-audit --no-fund >/dev/null 2>&1 || echo "cloud-setup: agent-browser não instalou" >&2
fi
exit 0
