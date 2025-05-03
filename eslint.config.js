import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config({ ignores: ["dist"] }, {
    files: ["**/*.{ts,tsx,js}"], // 👈 include JS files
    languageOptions: {
        ecmaVersion: 2022,
        globals: globals.node, // 👈 if used in Node.js
    },
    plugins: {
        "react-hooks": reactHooks,
        "react-refresh": reactRefresh,
    },
    rules: {
        ...reactHooks.configs.recommended.rules,
        "react-refresh/only-export-components": [
            "warn",
            { allowConstantExport: true },
        ],
        "@typescript-eslint/no-unused-vars": "off",
    },
});