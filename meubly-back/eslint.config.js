import globals from "globals";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["node_modules/**", "coverage/**"] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: globals.node },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_|^next$" }],
    },
  },
  {
    files: ["tests/**"],
    languageOptions: { globals: { ...globals.node, ...globals.vitest } },
  },
  prettier,
];
