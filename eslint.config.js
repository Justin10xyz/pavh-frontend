import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default defineConfig([
	{
		name: 'app/files-to-lint',
		files: ['**/*.{vue,js,mjs,jsx}'],
	},

	globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
		},
	},

	js.configs.recommended,
	...pluginVue.configs['flat/essential'],

	{
		rules: {
			indent: ['error', 'tab', { SwitchCase: 1 }],
		},
	},
	{
		files: ['**/*.vue'],
		rules: {
			indent: 'off',
			'vue/script-indent': ['error', 'tab', {
				baseIndent: 0,
				switchCase: 1,
			}],
			'vue/html-indent': ['error', 'tab'],
			'vue/multi-word-component-names': 'off',
		},
	},
])
