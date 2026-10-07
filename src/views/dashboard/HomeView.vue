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
</script>

<style scoped>

</style>
