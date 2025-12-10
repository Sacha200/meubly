import globals from "globals";
import pluginJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettier from "eslint-plugin-prettier";

export default [
  {languageOptions: { globals: globals.node }},
  pluginJs.configs.recommended,
  {
      plugins: {
          prettier: eslintPluginPrettier,
      },
      rules: {
          "no-unused-vars": "warn",
          "no-undef": "error",
          "prettier/prettier": "error",
      },
  },
  eslintConfigPrettier,
];
