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
				<InputTextCustom
					v-model="searchQuery"
					placeholder="Buscar por folio o cliente…"
					class="max-w-md pl-8"
				/>
			</div>

			<DateRangeFilter :model-value="activeFilter" @update:model-value="applyDateFilter" />
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

				<Column header="" style="width: 3rem">
					<template #body="{ data }">
						<button
							type="button"
							class="text-text-muted hover:text-accent transition-colors"
							aria-label="Ver venta"
							title="Ver venta"
							@click="viewSale(data.id)"
						>
							<i class="ti ti-eye text-[15px]"></i>
						</button>
					</template>
				</Column>
			</DataTable>
		</div>
	</div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useSalesStore } from '@/stores/sales'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'
import DateRangeFilter from '@/components/widgets/filters/DateRangeFilter.vue'
import { dateRangeFor } from '@/lib/dateRanges'

const router = useRouter()
const sales = useSalesStore()

const activeFilter = ref('all')

// Siempre se consulta al montar (no se usa `initialized` como gate): el filtro
// activo vive en la vista y vuelve a "Todas" al regresar, así que lo que haya
// quedado en el store (otro rango, o sin las ventas recién creadas en POS,
// porque createSale() no toca `sales`) no corresponde a lo que se muestra.
onMounted(() => {
	sales.fetchSales()
})

function viewSale(id) {
	router.push({ name: 'pos.sales.show', params: { id } })
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
