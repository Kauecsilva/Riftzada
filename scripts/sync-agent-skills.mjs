// Copia as skills de .claude/skills (fonte) para .agents/skills, a pasta que o Codex lê.
// shortcut: cópia versionada em vez de symlink, porque o Git no Windows costuma
// gravar symlink como arquivo de texto. Se o Claude Code passar a ler .agents/skills,
// apague a cópia e este script.
// Uso: node scripts/sync-agent-skills.mjs [--check]
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC = ".claude/skills";
const DEST = ".agents/skills";

function files(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true })
    .map((p) => join(dir, p))
    .filter((p) => statSync(p).isFile())
    .map((p) => relative(dir, p).replaceAll("\\", "/"))
    .sort();
}

if (process.argv.includes("--check")) {
  const a = files(SRC);
  const b = files(DEST);
  const diff = [
    ...a.filter((f) => !b.includes(f) || !readFileSync(join(SRC, f)).equals(readFileSync(join(DEST, f)))),
    ...b.filter((f) => !a.includes(f)),
  ];
  if (diff.length) {
    console.error(`${DEST} difere de ${SRC} em ${diff.length} arquivo(s), ex.: ${diff.slice(0, 5).join(", ")}`);
    console.error("Rode: npm run skills:sync");
    process.exit(1);
  }
  console.log(`${DEST} em dia com ${SRC} (${a.length} arquivos).`);
} else {
  rmSync(DEST, { recursive: true, force: true });
  cpSync(SRC, DEST, { recursive: true });
  console.log(`Copiado ${SRC} -> ${DEST} (${files(DEST).length} arquivos).`);
}
