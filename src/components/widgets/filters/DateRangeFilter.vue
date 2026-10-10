<template>
	<div class="flex flex-wrap items-center gap-2" role="group" :aria-label="label">
		<button
			v-for="filter in DATE_FILTERS"
			:key="filter.key"
			type="button"
			class="text-sm px-3 py-2 bg-surface border rounded-md transition-colors select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
			:class="modelValue === filter.key
				? 'border-accent text-text font-medium'
				: 'border-border text-text-muted hover:text-text'"
			:aria-pressed="modelValue === filter.key"
			@click="emit('update:modelValue', filter.key)"
		>
			{{ filter.label }}
		</button>
	</div>
</template>

<script setup>
// Solo emite la clave del filtro ('all' | 'today' | 'week' | 'month'); el
// padre la convierte a { from, to } con dateRangeFor() de @/lib/dateRanges.
const DATE_FILTERS = [
	{ key: 'all', label: 'Todas' },
	{ key: 'today', label: 'Hoy' },
	{ key: 'week', label: 'Esta semana' },
	{ key: 'month', label: 'Este mes' },
]

defineProps({
	modelValue: {
		type: String,
		required: true,
	},
	label: {
		type: String,
		default: 'Filtrar por fecha',
	},
})

const emit = defineEmits(['update:modelValue'])
</script>

<style scoped>

</style>
