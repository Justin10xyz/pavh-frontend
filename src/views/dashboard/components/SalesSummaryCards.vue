<template>
	<section aria-labelledby="sales-summary-heading" :aria-busy="loading">
		<h2 id="sales-summary-heading" class="text-sm font-medium text-text-muted mb-2">Ventas</h2>

		<p v-if="error && !loading" class="text-sm text-danger bg-surface border border-border rounded-md px-5 py-4">
			{{ error }}
		</p>

		<div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-3">
			<!-- Cada card abre el listado de ventas ya filtrado a su periodo
			     (?periodo= de SalesView), como "Ver todo" de Cotizaciones activas. -->
			<router-link
				v-for="card in cards"
				:key="card.key"
				:to="{ name: 'pos.sales.index', query: { periodo: card.period } }"
				class="group block bg-surface border border-border rounded-md p-5 hover:border-accent focus:outline-none focus-visible:border-accent transition-colors"
			>
				<span class="flex items-center justify-between gap-2 text-xs text-text-muted">
					{{ card.label }}
					<i class="ti ti-chevron-right group-hover:text-text transition-colors" aria-hidden="true"></i>
				</span>
				<span v-if="loading" class="block h-8 w-36 mt-1 rounded bg-border animate-pulse" aria-hidden="true"></span>
				<span v-else class="block text-2xl font-semibold text-text mt-1 tabular-nums">
					{{ formatCurrency(summary[card.key]) }}
				</span>
				<span class="sr-only">, ver ventas</span>
			</router-link>
		</div>
	</section>
</template>

<script setup>
import { formatCurrency } from '@/lib/formatCurrency'

defineProps({
	// { today, week, month }
	summary: {
		type: Object,
		required: true,
	},
	loading: {
		type: Boolean,
		default: false,
	},
	error: {
		type: String,
		default: null,
	},
})

// `period`: valor de ?periodo= que entiende SalesView.
const cards = [
	{ key: 'today', label: 'Hoy', period: 'hoy' },
	{ key: 'week', label: 'Esta semana', period: 'semana' },
	{ key: 'month', label: 'Este mes', period: 'mes' },
]
</script>

<style scoped>

</style>
