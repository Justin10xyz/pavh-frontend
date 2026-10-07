<template>
	<section aria-labelledby="active-quotes-heading" class="bg-surface border border-border rounded-md">
		<div class="flex items-center justify-between px-5 py-3 border-b border-border">
			<h2 id="active-quotes-heading" class="text-sm font-medium text-text">Cotizaciones activas</h2>
			<router-link
				:to="{ name: 'quotes' }"
				class="text-xs text-text-muted hover:text-text focus:outline-none focus-visible:underline transition-colors"
			>
				Ver todo
			</router-link>
		</div>

		<p v-if="quotes.length === 0" class="px-5 py-6 text-sm text-text-muted text-center">
			No hay cotizaciones en borrador.
		</p>
		<ul v-else class="divide-y divide-border">
			<li
				v-for="quote in quotes"
				:key="quote.id"
				class="flex items-center justify-between gap-4 px-5 py-3"
			>
				<span class="min-w-0">
					<span class="block text-sm font-medium text-text">{{ quote.folio }}</span>
					<span class="block text-xs text-text-muted truncate" :class="{ italic: !quote.customer }">
						{{ quote.customer?.name ?? 'Sin cliente' }}
					</span>
				</span>
				<span class="text-sm text-text tabular-nums flex-shrink-0">{{ formatCurrency(quote.total) }}</span>
			</li>
		</ul>
	</section>
</template>

<script setup>
import { formatCurrency } from '@/lib/formatCurrency'

defineProps({
	quotes: {
		type: Array,
		required: true,
	},
})
</script>

<style scoped>

</style>
