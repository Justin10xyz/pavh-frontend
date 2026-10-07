<template>
	<div class="p-2">
		<div class="flex items-center justify-between mb-4">
			<h1 class="font-serif text-xl text-primary">Ventas</h1>
			<RouterLink
				:to="{ name: 'pos.sales.create' }"
				class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors inline-flex items-center select-none"
			>
				Nueva venta
			</RouterLink>
		</div>

		<div class="flex flex-wrap items-center gap-3 mb-4">
			<div class="relative flex-1 min-w-[220px]">
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

			<div class="flex items-center gap-2" role="group" aria-label="Filtrar por fecha">
				<button
					v-for="filter in dateFilters"
					:key="filter.key"
					type="button"
					class="text-sm px-3 py-2 bg-surface border rounded-md transition-colors select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
					:class="activeFilter === filter.key
						? 'border-accent text-text font-medium'
						: 'border-border text-text-muted hover:text-text'"
					:aria-pressed="activeFilter === filter.key"
					@click="applyDateFilter(filter.key)"
				>
					{{ filter.label }}
				</button>
			</div>
		</div>

		<div v-if="sales.loading" class="text-text-muted text-sm">Cargando ventas…</div>
		<div v-else-if="sales.error" class="text-danger text-sm">{{ sales.error }}</div>

		<div v-else-if="filteredSales.length === 0" class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface">
			No se encontraron ventas con esos filtros.
		</div>

		<div v-else class="bg-surface border border-border rounded-md overflow-hidden">
			<DataTable :value="filteredSales" dataKey="id" class="sales-table">
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

				<Column header="Total" style="width: 9rem">
					<template #body="{ data }">
						<span class="text-text">{{ formatCurrency(data.total) }}</span>
					</template>
				</Column>
			</DataTable>
		</div>
	</div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useSalesStore } from '@/stores/sales'

const sales = useSalesStore()

const dateFilters = [
	{ key: 'all', label: 'Todas' },
	{ key: 'today', label: 'Hoy' },
	{ key: 'week', label: 'Esta semana' },
	{ key: 'month', label: 'Este mes' },
]

const activeFilter = ref('all')

// Siempre se consulta al montar (no se usa `initialized` como gate): el filtro
// activo vive en la vista y vuelve a "Todas" al regresar, así que lo que haya
// quedado en el store (otro rango, o sin las ventas recién creadas en POS,
// porque createSale() no toca `sales`) no corresponde a lo que se muestra.
onMounted(() => {
	sales.fetchSales()
})

// Fecha local en YYYY-MM-DD; toISOString() la convertiría a UTC y en la noche
// podría correrse al día siguiente.
function toDateParam(date) {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

// Rangos de calendario terminando hoy; la semana empieza en lunes.
function dateRangeFor(key) {
	const today = new Date()
	const to = toDateParam(today)

	if (key === 'today') return { from: to, to }

	if (key === 'week') {
		const monday = new Date(today)
		monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
		return { from: toDateParam(monday), to }
	}

	if (key === 'month') {
		return { from: toDateParam(new Date(today.getFullYear(), today.getMonth(), 1)), to }
	}

	return null
}

function applyDateFilter(key) {
	activeFilter.value = key
	const range = dateRangeFor(key)
	if (range) sales.fetchSales(range)
	else sales.fetchSales()
}

const searchQuery = ref('')

function normalize(str) {
	return (str ?? '')
		.toString()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
}

const filteredSales = computed(() => {
	const q = normalize(searchQuery.value)
	if (!q) return sales.sales

	return sales.sales.filter(
		(sale) => normalize(sale.folio).includes(q) || normalize(sale.customer?.name).includes(q)
	)
})

const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function formatCurrency(value) {
	return currencyFormatter.format(Number(value))
}

function formatDate(value) {
	return new Date(value).toLocaleString('es-MX', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}
</script>

<style scoped>
.sales-table :deep(table) {
	width: 100%;
	border-collapse: collapse;
}
.sales-table :deep(thead th) {
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
.sales-table :deep(tbody > tr > td) {
	padding: 0.5rem 0.75rem;
	vertical-align: middle;
	border-bottom: 1px solid var(--color-border);
	font-size: 0.8125rem;
}
.sales-table :deep(tbody > tr:last-child > td) {
	border-bottom: none;
}
.sales-table :deep(tbody > tr:hover) {
	background: var(--color-bg);
}
</style>
