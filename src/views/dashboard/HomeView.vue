<template>
	<div class="p-2">
		<div class="mb-4">
			<h1 class="font-serif text-xl text-primary">Dashboard</h1>
			<p class="text-sm text-text-muted mt-0.5">Resumen de ventas, inventario y cotizaciones.</p>
		</div>

		<SalesSummaryCards
			:summary="dashboard.salesSummary"
			:loading="dashboard.salesLoading"
			:error="dashboard.salesError"
			class="mb-6"
		/>
		<DashboardShortcuts class="mb-6" />

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
			<LowStockWidget
				:variants="dashboard.lowStockVariants"
				:loading="dashboard.lowStockLoading"
				:error="dashboard.lowStockError"
			/>
			<ActiveQuotesWidget :quotes="activeQuotes" />
		</div>
	</div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import SalesSummaryCards from './components/SalesSummaryCards.vue'
import DashboardShortcuts from './components/DashboardShortcuts.vue'
import LowStockWidget from './components/LowStockWidget.vue'
import ActiveQuotesWidget from './components/ActiveQuotesWidget.vue'

const dashboard = useDashboardStore()

// Sin `initialized`: el dashboard se consulta en cada visita.
onMounted(() => {
	dashboard.fetchDashboardData()
})

// Datos de ejemplo con la misma forma que expone el store dashboard.js; se
// reemplaza por el store en el paso 5 (cotizaciones activas).
const activeQuotes = [
	{ id: 1, folio: 'COT-0012', customer: { name: 'Constructora del Norte' }, total: '18450.00' },
	{ id: 2, folio: 'COT-0011', customer: null, total: '6320.50' },
	{ id: 3, folio: 'COT-0009', customer: { name: 'María López' }, total: '27900.00' },
]
</script>

<style scoped>

</style>
