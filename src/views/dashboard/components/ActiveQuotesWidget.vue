<template>
	<section aria-labelledby="active-quotes-heading" :aria-busy="loading" class="bg-surface border border-border rounded-md">
		<div class="flex items-center justify-between px-5 py-3 border-b border-border">
			<h2 id="active-quotes-heading" class="text-sm font-medium text-text">Cotizaciones activas</h2>
			<router-link
				:to="{ name: 'quotes' }"
				class="text-xs text-text-muted hover:text-text focus:outline-none focus-visible:underline transition-colors"
			>
				Ver todo
			</router-link>
		</div>

		<p v-if="error && !loading" class="px-5 py-6 text-sm text-danger text-center">
			{{ error }}
		</p>

		<ul v-else-if="loading" class="divide-y divide-border" aria-hidden="true">
			<li v-for="n in 3" :key="n" class="flex items-center justify-between gap-4 px-5 py-3">
				<span class="flex-1">
					<span class="block h-4 w-20 rounded bg-border animate-pulse"></span>
					<span class="block h-3 w-32 mt-1.5 rounded bg-border animate-pulse"></span>
				</span>
				<span class="block h-4 w-20 rounded bg-border animate-pulse"></span>
			</li>
		</ul>

		<p v-else-if="quotes.length === 0" class="px-5 py-6 text-sm text-text-muted text-center">
			No hay cotizaciones en borrador.
		</p>
		<ul v-else class="divide-y divide-border">
			<li v-for="quote in visibleQuotes" :key="quote.id">
				<router-link
					:to="{ name: 'quotes.show', params: { id: quote.id } }"
					class="group flex items-center justify-between gap-4 px-5 py-3 hover:bg-bg focus:outline-none focus-visible:bg-bg transition-colors"
				>
					<span class="min-w-0">
						<span class="block text-sm font-medium text-text">{{ quote.folio }}</span>
						<span class="block text-xs text-text-muted truncate" :class="{ italic: !quote.customer }">
							{{ quote.customer?.name ?? 'Sin cliente' }}
						</span>
					</span>
					<span class="flex items-center gap-3 flex-shrink-0">
						<span class="text-sm text-text tabular-nums">{{ formatCurrency(quote.total) }}</span>
						<i class="ti ti-chevron-right text-text-muted group-hover:text-text transition-colors"></i>
					</span>
				</router-link>
			</li>
			<li v-if="hiddenCount > 0" class="px-5 py-2.5 text-xs text-text-muted">
				Y {{ hiddenCount }} más en borrador.
			</li>
		</ul>
	</section>
</template>

<script setup>
import { computed } from 'vue'
import { formatCurrency } from '@/lib/formatCurrency'

const MAX_ROWS = 5

const props = defineProps({
	quotes: {
		type: Array,
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

// Lista corta: las más recientes primero. GET /api/quotes no ordena
// explícitamente, así que no se depende del orden en que llegan.
const visibleQuotes = computed(() =>
	[...props.quotes]
		.sort((a, b) => new Date(b.created_at) - new Date(a.created_at) || b.id - a.id)
		.slice(0, MAX_ROWS)
)

const hiddenCount = computed(() => Math.max(props.quotes.length - MAX_ROWS, 0))
</script>

<style scoped>

</style>
