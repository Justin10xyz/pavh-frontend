<template>
	<section aria-labelledby="sales-summary-heading" :aria-busy="loading">
		<h2 id="sales-summary-heading" class="text-sm font-medium text-text-muted mb-2">Ventas</h2>

		<p v-if="error && !loading" class="text-sm text-danger bg-surface border border-border rounded-md px-5 py-4">
			{{ error }}
		</p>

		<div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-3">
			<div
				v-for="card in cards"
				:key="card.key"
				class="bg-surface border border-border rounded-md p-5"
			>
				<span class="block text-xs text-text-muted">{{ card.label }}</span>
				<span v-if="loading" class="block h-8 w-36 mt-1 rounded bg-border animate-pulse" aria-hidden="true"></span>
				<span v-else class="block text-2xl font-semibold text-text mt-1 tabular-nums">
					{{ formatCurrency(summary[card.key]) }}
				</span>
			</div>
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

const cards = [
	{ key: 'today', label: 'Hoy' },
	{ key: 'week', label: 'Esta semana' },
	{ key: 'month', label: 'Este mes' },
]
</script>

<style scoped>

</style>
