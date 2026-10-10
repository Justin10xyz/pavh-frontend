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
			<ActiveQuotesWidget
				:quotes="dashboard.activeQuotes"
				:loading="dashboard.activeQuotesLoading"
				:error="dashboard.activeQuotesError"
			/>
			<TopProductsWidget
				v-model:filter="topProductsFilter"
				:products="dashboard.topProducts"
				:loading="dashboard.topProductsLoading"
				:error="dashboard.topProductsError"
				class="lg:col-span-2"
			/>
		</div>
	</div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { dateRangeFor } from '@/lib/dateRanges'
import SalesSummaryCards from './components/SalesSummaryCards.vue'
import DashboardShortcuts from './components/DashboardShortcuts.vue'
import LowStockWidget from './components/LowStockWidget.vue'
import ActiveQuotesWidget from './components/ActiveQuotesWidget.vue'
import TopProductsWidget from './components/TopProductsWidget.vue'

const dashboard = useDashboardStore()

// Vive en la vista (no en el store), igual que en SalesView: vuelve a "Este mes"
// en cada visita.
const topProductsFilter = ref('month')

function loadTopProducts() {
	dashboard.fetchTopProducts(dateRangeFor(topProductsFilter.value))
}

watch(topProductsFilter, loadTopProducts)

// Sin `initialized`: el dashboard se consulta en cada visita.
onMounted(() => {
	dashboard.fetchDashboardData()
	loadTopProducts()
})
</script>

<style scoped>

</style>
