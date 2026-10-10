<template>
	<Select
		v-model="model"
		:options="normalizedOptions"
		option-label="label"
		option-value="value"
		:label-id="id"
		:placeholder="loading ? loadingText : placeholder"
		:loading="loading"
		:disabled="disabled || loading"
		:invalid="!!error"
		:empty-message="emptyMessage"
		scroll-height="16rem"
		:pt="pt"
	/>
</template>

<script setup>
import { computed } from 'vue'
import Select from 'primevue/select'

// Envuelve el Select de PrimeVue (modo unstyled, ver main.js) para estilizarlo
// en un solo lugar vía `pt`. `@change` y demás atributos caen directo al Select.
const model = defineModel({ type: [String, Number], default: '' })

const props = defineProps({
	// Se pasa como `labelId` al elemento enfocable para que el <label for> funcione.
	id: { type: String, default: undefined },
	// Arreglo de objetos ({ id, name }) o de valores primitivos (ej. ['I', 'II']).
	options: { type: Array, default: () => [] },
	optionValue: { type: String, default: 'id' },
	optionLabel: { type: String, default: 'name' },
	placeholder: { type: String, default: '' },
	// Si es true, se agrega una opción vacía ('') con el texto del placeholder (ej. "Sin categoría").
	allowEmpty: { type: Boolean, default: false },
	loading: { type: Boolean, default: false },
	loadingText: { type: String, default: 'Cargando…' },
	disabled: { type: Boolean, default: false },
	error: { type: [String, Boolean], default: '' },
	emptyMessage: { type: String, default: 'Sin opciones' },
})

function isObject(option) {
	return option !== null && typeof option === 'object'
}

// Se normaliza a { value, label } para que objetos y primitivos se traten igual
// y para poder anteponer la opción vacía de `allowEmpty`.
const normalizedOptions = computed(() => {
	const options = props.options.map((option) => ({
		value: isObject(option) ? option[props.optionValue] : option,
		label: isObject(option) ? option[props.optionLabel] : option,
	}))

	return props.allowEmpty ? [{ value: '', label: props.placeholder }, ...options] : options
})

const showsPlaceholder = computed(
	() => model.value === '' || model.value === null || !normalizedOptions.value.some((o) => o.value === model.value),
)

const srOnly = { class: 'sr-only' }

const pt = computed(() => ({
	root: {
		class: [
			'relative flex items-center w-full h-[38px] bg-surface border rounded-md px-3 gap-2 transition-colors select-none',
			props.error ? 'border-danger' : 'border-border focus-within:border-accent',
			props.disabled || props.loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
		],
	},
	label: {
		class: [
			'flex-1 min-w-0 truncate text-sm focus:outline-none',
			showsPlaceholder.value ? 'text-text-muted' : 'text-text',
		],
	},
	dropdown: { class: 'flex items-center shrink-0 text-text-muted' },
	dropdownIcon: { class: 'w-3.5 h-3.5' },
	loadingIcon: { class: 'w-3.5 h-3.5 animate-spin' },
	// Se monta en <body>: `absolute` es necesario porque PrimeVue solo calcula left/top.
	overlay: { class: 'absolute mt-1 bg-surface border border-border rounded-md shadow-lg overflow-hidden' },
	listContainer: { class: 'overflow-y-auto' },
	list: { class: 'py-1' },
	option: ({ context }) => ({
		class: [
			'px-3 py-2 text-sm cursor-pointer transition-colors',
			context.selected ? 'text-accent font-medium' : 'text-text',
			context.focused ? 'bg-bg' : '',
		],
	}),
	emptyMessage: { class: 'px-3 py-2 text-sm text-text-muted' },
	hiddenFirstFocusableEl: srOnly,
	hiddenLastFocusableEl: srOnly,
	hiddenFilterResult: srOnly,
	hiddenEmptyMessage: srOnly,
	hiddenSelectedMessage: srOnly,
}))
</script>
