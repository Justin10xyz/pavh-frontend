<template>
	<InputText v-model="model" :invalid="!!error" :pt="pt" />
</template>

<script setup>
import { computed } from 'vue'
import InputText from 'primevue/inputtext'

// Envuelve el InputText de PrimeVue (modo unstyled, ver main.js) para estilizarlo
// en un solo lugar vía `pt`. `id`, `type`, `placeholder`, `disabled`, `@input`,
// `class` y demás atributos caen directo al <input>.
const model = defineModel({ type: String, default: '' })

const props = defineProps({
	error: { type: [String, Boolean], default: '' },
})

const pt = computed(() => ({
	root: {
		class: [
			'w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md disabled:opacity-60 disabled:cursor-not-allowed',
			props.error ? 'border-danger focus:border-danger' : 'border-border focus:border-accent',
		],
	},
}))
</script>
