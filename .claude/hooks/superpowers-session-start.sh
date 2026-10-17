#!/usr/bin/env bash
# Adaptado de obra/superpowers (hooks/session-start): injeta a skill
# using-superpowers no contexto de cada sessão, como o plugin original faz.
set -euo pipefail
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
skill_md="$ROOT/.claude/skills/using-superpowers/SKILL.md"
[ -r "$skill_md" ] || exit 0
content="$(<"$skill_md")"
esc() { local s="$1"; s="${s//\\/\\\\}"; s="${s//\"/\\\"}"; s="${s//$'\n'/\\n}"; s="${s//$'\r'/\\r}"; s="${s//$'\t'/\\t}"; printf '%s' "$s"; }
ctx="<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n**Below is the full content of your 'using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**\n\n$(esc "$content")\n</EXTREMELY_IMPORTANT>"
printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' "$ctx"
