<template>
	<div class="p-2">
		<div class="flex items-center justify-between mb-4">
			<h1 class="font-serif text-xl text-primary">Cotizaciones</h1>
			<button
				type="button"
				class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors inline-flex items-center select-none"
				@click="createQuote"
			>
				Nueva cotización
			</button>
		</div>

		<div v-if="quotes.loading" class="text-text-muted text-sm">Cargando cotizaciones…</div>
		<div v-else-if="quotes.error" class="text-danger text-sm">{{ quotes.error }}</div>

		<template v-else>
			<div class="relative flex-1 min-w-[220px] mb-4">
				<svg
					class="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
					width="14" height="14" viewBox="0 0 24 24" fill="none"
					stroke="currentColor" stroke-width="2"
				>
					<circle cx="11" cy="11" r="7" />
					<line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
				<input
					v-model="searchQuery"
					type="text"
					placeholder="Buscar por folio o cliente…"
					class="w-full max-w-md pl-8 pr-3 py-2 text-sm bg-surface border border-border rounded-md text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
				/>
			</div>

			<div v-if="filteredQuotes.length === 0" class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface">
				No se encontraron cotizaciones con esos filtros.
			</div>

			<div v-else class="bg-surface border border-border rounded-md overflow-hidden">
				<DataTable :value="filteredQuotes" dataKey="id" class="quotes-table">
					<Column header="Folio">
						<template #body="{ data }">
							<span class="font-medium text-text">{{ data.folio }}</span>
						</template>
					</Column>

					<Column header="Cliente">
						<template #body="{ data }">
							<span :class="data.customer ? 'text-text' : 'text-text-muted'">
								{{ data.customer?.name ?? 'Sin cliente' }}
							</span>
						</template>
					</Column>

					<Column header="Fecha">
						<template #body="{ data }">
							<span class="text-text-muted">{{ formatDate(data.created_at) }}</span>
						</template>
					</Column>

					<Column header="Status">
						<template #body="{ data }">
							<span class="text-[10px] px-2 py-0.5 rounded" :class="statusClasses(data.status)">
								{{ data.status }}
							</span>
						</template>
					</Column>

					<Column header="Total" style="width: 9rem">
						<template #body="{ data }">
							<span class="text-text">{{ formatCurrency(data.total) }}</span>
						</template>
					</Column>

					<Column header="" style="width: 3rem">
						<template #body="{ data }">
							<button
								type="button"
								class="text-text-muted hover:text-accent transition-colors"
								aria-label="Ver cotización"
								title="Ver cotización"
								@click="viewQuote(data.id)"
							>
								<i class="ti ti-eye text-[15px]"></i>
							</button>
						</template>
					</Column>
				</DataTable>
			</div>
		</template>
	</div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useQuotesStore } from '@/stores/quotes'
import { statusClasses } from '@/lib/quoteStatus'

const router = useRouter()
const quotes = useQuotesStore()

onMounted(() => {
	if (!quotes.initialized) quotes.fetchQuotes()
})

function createQuote() {
	router.push({ path: '/cotizaciones/nueva' })
}

function viewQuote(id) {
	router.push({ path: `/cotizaciones/${id}` })
}

const searchQuery = ref('')

function normalize(str) {
	return (str ?? '')
		.toString()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
}

const filteredQuotes = computed(() => {
	const q = normalize(searchQuery.value)
	if (!q) return quotes.quotes

	return quotes.quotes.filter(
		(quote) => normalize(quote.folio).includes(q) || normalize(quote.customer?.name).includes(q)
	)
})

const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function formatCurrency(value) {
	return currencyFormatter.format(Number(value))
}

function formatDate(value) {
	return new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.quotes-table :deep(table) {
	width: 100%;
	border-collapse: collapse;
}
.quotes-table :deep(thead th) {
	text-align: left;
	font-size: 11px;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.03em;
	color: var(--color-text-muted);
	background: var(--color-bg);
	padding: 0.5rem 0.75rem;
	border-bottom: 1px solid var(--color-border);
}
.quotes-table :deep(tbody > tr > td) {
	padding: 0.5rem 0.75rem;
	vertical-align: middle;
	border-bottom: 1px solid var(--color-border);
	font-size: 0.8125rem;
}
.quotes-table :deep(tbody > tr:last-child > td) {
	border-bottom: none;
}
.quotes-table :deep(tbody > tr:hover) {
	background: var(--color-bg);
}
</style>
