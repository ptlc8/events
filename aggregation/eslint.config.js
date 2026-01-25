import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import jsdoc from "eslint-plugin-jsdoc";

export default defineConfig([
    js.configs.recommended,
    jsdoc.configs['flat/recommended'],
    {
        languageOptions: {
            globals: {
                ...globals.node,
            }
        },
        rules: {
            "jsdoc/no-undefined-types": 1,
            "no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
            "no-console": ["warn", { allow: ["warn", "error", "info"] }],
            "jsdoc/require-param-description": "off",
            "jsdoc/require-returns-description": "off",
            semi: "warn",
        },
        plugins: {
            jsdoc,
        }
    }
]);
