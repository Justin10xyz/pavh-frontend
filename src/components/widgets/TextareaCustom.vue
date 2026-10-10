<template>
	<Textarea v-model="model" :invalid="!!error" :pt="pt" />
</template>

<script setup>
import { computed } from 'vue'
import Textarea from 'primevue/textarea'

// Envuelve el Textarea de PrimeVue (modo unstyled, ver main.js) para estilizarlo
// en un solo lugar vía `pt`. `id`, `rows`, `placeholder`, `@input` y demás
// atributos caen directo al <textarea>.
const model = defineModel({ type: String, default: '' })

const props = defineProps({
	error: { type: [String, Boolean], default: '' },
})

const pt = computed(() => ({
	root: {
		class: [
			'w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 py-2 rounded-md resize-none disabled:opacity-60 disabled:cursor-not-allowed',
			props.error ? 'border-danger focus:border-danger' : 'border-border focus:border-accent',
		],
	},
}))
</script>
