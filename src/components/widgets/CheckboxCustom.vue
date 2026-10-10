<template>
	<Checkbox v-model="model" binary :input-id="id" :invalid="!!error" :pt="pt" />
</template>

<script setup>
import { computed } from 'vue'
import Checkbox from 'primevue/checkbox'

// Envuelve el Checkbox de PrimeVue (modo unstyled, ver main.js) para estilizarlo
// en un solo lugar vía `pt`. Siempre es binario (v-model booleano); `disabled`,
// `@change` y demás atributos caen directo al Checkbox. Se puede envolver en un
// <label> o usar `id` con un <label for>.
const model = defineModel({ type: Boolean, default: false })

const props = defineProps({
	// Se pasa como `inputId` para que el <label for> apunte al <input> interno.
	id: { type: String, default: undefined },
	size: { type: String, default: 'md', validator: (value) => ['sm', 'md'].includes(value) },
	error: { type: [String, Boolean], default: '' },
})

const pt = computed(() => ({
	root: {
		class: ['relative inline-flex shrink-0', props.size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'],
	},
	// El <input> nativo queda invisible encima de la caja: recibe el click y el foco.
	input: {
		class: 'peer absolute inset-0 z-10 w-full h-full m-0 opacity-0 cursor-pointer disabled:cursor-not-allowed',
	},
	box: {
		class: [
			'flex items-center justify-center w-full h-full rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 peer-disabled:opacity-60',
			model.value ? 'bg-accent border-accent text-white' : 'bg-surface',
			!model.value && (props.error ? 'border-danger' : 'border-border peer-hover:border-accent'),
		],
	},
	icon: { class: props.size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3' },
}))
</script>
