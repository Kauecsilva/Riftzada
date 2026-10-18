// Gate de async com tipos (Vibe Coding Toolkit). Roda separado: npm run lint:typed.
import defaultConfig from "./eslint.config.mjs";

const config = [
  ...defaultConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      // 4 violações legadas na adoção (out/2026); sobe para "error" quando zerar. Ver docs/quality.md.
      "@typescript-eslint/no-misused-promises": "warn",
    },
  },
];

export default config;
