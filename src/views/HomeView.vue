<template>
	<div class="p-2">
		<div class="mb-4">
			<h1 class="font-serif text-xl text-primary">Dashboard</h1>
			<p class="text-sm text-text-muted mt-0.5">Resumen de ventas, inventario y cotizaciones.</p>
		</div>

		<SalesSummaryCards :summary="salesSummary" class="mb-6" />
		<DashboardShortcuts class="mb-6" />

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
			<LowStockWidget :variants="lowStockVariants" />
			<ActiveQuotesWidget :quotes="activeQuotes" />
		</div>
	</div>
</template>

<script setup>
import SalesSummaryCards from './dashboard/components/SalesSummaryCards.vue'
import DashboardShortcuts from './dashboard/components/DashboardShortcuts.vue'
import LowStockWidget from './dashboard/components/LowStockWidget.vue'
import ActiveQuotesWidget from './dashboard/components/ActiveQuotesWidget.vue'

// Datos de ejemplo con la misma forma que expone el store dashboard.js; se
// reemplazan por el store cuando se conecte la vista (paso siguiente).
const salesSummary = { today: 12450.5, week: 68320, month: 241875.75 }

const lowStockVariants = [
	{ id: 1, product: { name: 'Creato' }, color: 'Taupe', size: '60x120', stock_boxes: 3, minimum_stock: 10 },
	{ id: 2, product: { name: 'Bastille' }, color: 'Gris', size: '30x60', stock_boxes: 0, minimum_stock: 8 },
	{ id: 3, product: { name: 'Kenia' }, color: 'Beige', size: '45x45', stock_boxes: 5, minimum_stock: 12 },
]

const activeQuotes = [
	{ id: 1, folio: 'COT-0012', customer: { name: 'Constructora del Norte' }, total: '18450.00' },
	{ id: 2, folio: 'COT-0011', customer: null, total: '6320.50' },
	{ id: 3, folio: 'COT-0009', customer: { name: 'María López' }, total: '27900.00' },
]
</script>

<style scoped>

</style>
