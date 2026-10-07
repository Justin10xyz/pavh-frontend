<template>
	<section aria-labelledby="sales-summary-heading">
		<h2 id="sales-summary-heading" class="text-sm font-medium text-text-muted mb-2">Ventas</h2>
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
			<div
				v-for="card in cards"
				:key="card.key"
				class="bg-surface border border-border rounded-md p-5"
			>
				<span class="block text-xs text-text-muted">{{ card.label }}</span>
				<span class="block text-2xl font-semibold text-text mt-1 tabular-nums">
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
})

const cards = [
	{ key: 'today', label: 'Hoy' },
	{ key: 'week', label: 'Esta semana' },
	{ key: 'month', label: 'Este mes' },
]
</script>

<style scoped>

</style>
