import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
// Regras locais do Vibe Coding Toolkit (perfil Next leve). Autoteste: npm run lint:rules.
import quality from "./eslint-rules/index.cjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["eslint-rules/**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    plugins: { quality },
    rules: {
      // 1 arquivo legado acima do teto na adoção (src/lib/demo/store.ts); sobe para "error" quando zerar.
      "quality/max-lines": ["warn", { max: 350 }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    // Skills de agentes vendorizadas (código de terceiros).
    ".claude/**",
  ]),
]);

export default eslintConfig;
