<template>
	<InputNumber
		v-model="numberModel"
		:input-id="id"
		:invalid="!!error"
		locale="es-MX"
		:pt="pt"
		@input="numberModel = $event.value"
	/>
</template>

<script setup>
import { computed } from 'vue'
import InputNumber from 'primevue/inputnumber'

// Envuelve el InputNumber de PrimeVue (modo unstyled, ver main.js) para estilizarlo
// en un solo lugar vía `pt`. `placeholder`, `min`, `max`, `mode`, `currency`,
// `min-fraction-digits`, `max-fraction-digits`, `disabled`, `@input`, etc. caen
// directo al InputNumber. El modelo es `null` cuando el campo está vacío.
const model = defineModel({ type: [Number, String], default: null })

// Laravel serializa los decimales como string ("123.45"); InputNumber espera un número.
// InputNumber solo actualiza el modelo en blur/Enter; el `@input` del template lo
// actualiza mientras se escribe (ej. para que los totales de venta se recalculen al
// momento). El clamp a `min`/`max` sigue aplicándose en blur.
const numberModel = computed({
	get: () => (model.value === null || model.value === '' ? null : Number(model.value)),
	set: (value) => (model.value = value),
})

const props = defineProps({
	// Se pasa como `inputId` para que el <label for> apunte al <input> interno.
	id: { type: String, default: undefined },
	error: { type: [String, Boolean], default: '' },
})

const pt = computed(() => ({
	root: { class: 'block w-full' },
	pcInputText: {
		root: {
			class: [
				'w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md disabled:opacity-60 disabled:cursor-not-allowed',
				props.error ? 'border-danger focus:border-danger' : 'border-border focus:border-accent',
			],
		},
	},
}))
</script>
