import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import pluginVue from "eslint-plugin-vue";

export default defineConfig([
    {
        name: "app/files-to-lint",
        files: ["**/*.{vue,js,mjs,jsx}"],
    },

    globalIgnores(["**/dist/**", "**/dist-ssr/**", "**/coverage/**"]),

    {
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
    },

    js.configs.recommended,
    ...pluginVue.configs["flat/essential"],

    {
        rules: {
            // Cambiado de "tab" a 4 espacios
            indent: ["error", 4, { SwitchCase: 1 }],

            // end of line = lf
            "linebreak-style": ["error", "unix"],

            // insert final newline = true
            "eol-last": ["error", "always"],

            // trim trailing whitespace = true
            "no-trailing-spaces": ["error"],
        },
    },
    {
        files: ["**/*.vue"],
        rules: {
            indent: "off",
            "vue/script-indent": [
                "error",
                4, // Cambiado de "tab" a 4
                {
                    baseIndent: 0,
                    switchCase: 1,
                },
            ],
            "vue/html-indent": [
                "error",
                4,
                {
                    attribute: 1,
                    baseIndent: 1,
                    closeBracket: 0,
                    alignAttributesVertically: true,
                    ignores: [],
                },
            ],
            "vue/multi-word-component-names": "off",
        },
    },
]);
