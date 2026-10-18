import globals from "globals";
import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "cypress/videos/**",
      "cypress/screenshots/**",
    ],
  },
  js.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
    },
    rules: { "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }] },
  },
  {
    files: ["tests/**", "**/*.config.js"],
    languageOptions: { globals: { ...globals.node, ...globals.vitest } },
  },
  {
    files: ["cypress/**"],
    languageOptions: {
      globals: {
        ...globals.browser,
        cy: "readonly",
        Cypress: "readonly",
        describe: "readonly",
        it: "readonly",
        beforeEach: "readonly",
        expect: "readonly",
      },
    },
  },
  prettier,
];
