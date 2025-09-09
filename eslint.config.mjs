import globals from "globals";
import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jestDom from "eslint-plugin-jest-dom";

export default [
	// Ignore patterns
	{ ignores: ["modules/**"] },

	// ESLint core recommended rules
	js.configs.recommended,

	// Project rules and plugin configs
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			ecmaVersion: 14,
			sourceType: "module",
			parserOptions: {
				ecmaFeatures: { jsx: true },
			},
		},

		settings: {
			react: { version: "detect" },
		},

		plugins: {
			react: reactPlugin,
			"react-hooks": reactHooks,
		},

		rules: {
			// React recommended + JSX runtime presets
			...(reactPlugin.configs?.recommended?.rules ?? {}),
			...(reactPlugin.configs?.["jsx-runtime"]?.rules ?? {}),

			// React Hooks recommended
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",
		},
	},
	// Jest settings for tests
	{
		files: ["test/**/*.{js,jsx}"],
		languageOptions: {
			globals: {
				...globals.jest,
			},
		},
		plugins: {
			"jest-dom": jestDom,
		},
		rules: {
			...(jestDom.configs?.recommended?.rules ?? {}),
		},
	},
];