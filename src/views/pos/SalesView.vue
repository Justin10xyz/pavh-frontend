<template>
	<div class="p-2">
		<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
			<h1 class="font-serif text-xl text-primary">Ventas</h1>
			<RouterLink
				:to="{ name: 'pos.sales.create' }"
				class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-10 px-4 rounded-md transition-colors inline-flex items-center select-none"
			>
				Nueva venta
			</RouterLink>
		</div>

		<div class="flex flex-wrap items-center gap-3 mb-4">
			<div class="relative flex-1 min-w-56">
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

			<DateRangeFilter v-model="activeFilter" />
		</div>

		<div v-if="sales.loading" class="text-text-muted text-sm">Cargando ventas…</div>
		<div v-else-if="sales.error" class="text-danger text-sm">{{ sales.error }}</div>

		<div v-else-if="filteredSales.length === 0" class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface">
			{{
				activeFilter === 'all' && !searchQuery
					? 'Aún no hay ventas registradas.'
					: 'No se encontraron ventas con esos filtros.'
			}}
		</div>

		<template v-else>
			<!-- Resumen de lo que se ve (periodo + búsqueda): con "Hoy" sirve como
			     referencia para el corte de caja -->
			<p class="text-sm text-text-muted mb-2 sm:text-right" aria-live="polite">
				{{ filteredSales.length }} {{ filteredSales.length === 1 ? 'venta' : 'ventas' }}
				<span aria-hidden="true">·</span>
				Total <span class="font-semibold text-primary tabular-nums">{{ formatCurrency(filteredTotal) }}</span>
			</p>

			<div class="bg-surface border border-border rounded-md overflow-x-auto">
				<DataTable
					:value="filteredSales"
					dataKey="id"
					class="data-table"
					:row-class="() => 'cursor-pointer'"
					@row-click="openSale"
				>
					<Column header="Folio" body-class="whitespace-nowrap">
						<template #body="{ data }">
							<RouterLink
								:to="{ name: 'pos.sales.show', params: { id: data.id } }"
								class="font-medium text-text hover:text-accent transition-colors"
							>
								{{ data.folio }}
							</RouterLink>
							<!-- Sin columna Fecha por debajo de sm: va debajo del folio -->
							<span class="block sm:hidden text-xs text-text-muted">{{ formatDateTime(data.created_at) }}</span>
						</template>
					</Column>

					<Column header="Cliente">
						<template #body="{ data }">
							<span :class="data.customer ? 'text-text' : 'text-text-muted'">
								{{ data.customer?.name ?? 'Sin cliente' }}
							</span>
						</template>
					</Column>

					<Column
						header="Fecha"
						header-class="hidden sm:table-cell"
						body-class="hidden sm:table-cell whitespace-nowrap"
					>
						<template #body="{ data }">
							<span class="text-text-muted">{{ formatDateTime(data.created_at) }}</span>
						</template>
					</Column>

					<Column header="Total" header-class="text-right!" body-class="text-right whitespace-nowrap">
						<template #body="{ data }">
							<span class="font-semibold text-primary tabular-nums">{{ formatCurrency(data.total) }}</span>
						</template>
					</Column>

					<Column header="" body-class="w-px">
						<template #body="{ data }">
							<RouterLink
								:to="{ name: 'pos.sales.show', params: { id: data.id } }"
								class="flex items-center p-1.5 lg:p-1 rounded text-text-muted hover:bg-bg hover:text-accent transition-colors cursor-pointer"
								aria-label="Ver venta"
								title="Ver venta"
							>
								<i class="ti ti-eye text-base"></i>
							</RouterLink>
						</template>
					</Column>
				</DataTable>
			</div>
		</template>
	</div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useSalesStore } from '@/stores/sales'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'
import DateRangeFilter from '@/components/widgets/filters/DateRangeFilter.vue'
import { dateRangeFor } from '@/lib/dateRanges'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDateTime } from '@/lib/dates'

const route = useRoute()
const router = useRouter()
const sales = useSalesStore()

// Clave del filtro (la de DateRangeFilter) ↔ valor en la URL. La URL va en
// español, igual que el resto de paths/queries visibles.
const PERIOD_PARAMS = { today: 'hoy', week: 'semana', month: 'mes' }

// El periodo activo vive en la URL (?periodo=hoy), no en un ref: así se
// conserva al volver del detalle y se puede enlazar directo. Un valor
// desconocido cae a "Todas". Se usa replace para no llenar el historial de
// filtros (mismo patrón que ?estado= en QuotesView).
const activeFilter = computed({
	get: () => Object.keys(PERIOD_PARAMS).find((key) => PERIOD_PARAMS[key] === route.query.periodo) ?? 'all',
	set: (key) => {
		router.replace({ query: { ...route.query, periodo: PERIOD_PARAMS[key] } })
	},
})

// Siempre se consulta al montar y en cada cambio de periodo (no se usa
// `initialized` como gate): cada rango es una consulta distinta, y lo que
// haya quedado en el store puede no traer las ventas recién creadas en POS
// (createSale() no toca `sales`).
// Se filtra por nombre de ruta: al navegar al detalle, `route` ya cambió antes
// de que este componente se desmonte. Por lo mismo, el "Volver" del detalle
// regresa con el periodo guardado en `sales.listQuery`.
watch(
	() => (route.name === 'pos.sales.index' ? activeFilter.value : null),
	(key) => {
		if (key === null) return
		sales.listQuery = { ...route.query }
		sales.fetchSales(dateRangeFor(key) ?? {})
	},
	{ immediate: true }
)

// Toda la fila abre el detalle. Los clicks sobre un link propio (folio, ojo)
// se dejan al RouterLink, que ya soporta Ctrl/Cmd+click y click medio.
function openSale({ originalEvent, data }) {
	if (originalEvent.target.closest('a, button')) return

	const to = { name: 'pos.sales.show', params: { id: data.id } }
	if (originalEvent.ctrlKey || originalEvent.metaKey) {
		window.open(router.resolve(to).href, '_blank')
	} else {
		router.push(to)
	}
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

// `total` llega como string decimal desde Laravel
const filteredTotal = computed(() =>
	filteredSales.value.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)
)
</script>

<style scoped></style>
