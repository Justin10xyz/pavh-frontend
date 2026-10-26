<template>
    <div class="p-2">
        <div class="mb-4">
            <h1 class="font-serif text-xl text-primary">Dashboard</h1>
            <p class="text-sm text-text-muted mt-0.5">Resumen de inventario y presupuestos.</p>
        </div>

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
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { dateRangeFor } from '@/lib/dateRanges'
import DashboardShortcuts from './components/DashboardShortcuts.vue'
import LowStockWidget from './components/LowStockWidget.vue'
import ActiveQuotesWidget from './components/ActiveQuotesWidget.vue'
import TopProductsWidget from './components/TopProductsWidget.vue'

const dashboard = useDashboardStore()

// Vive en la vista (no en el store): vuelve a "Este mes" en cada visita.
const topProductsFilter = ref('month')

function loadTopProducts() {
    dashboard.fetchTopProducts(dateRangeFor(topProductsFilter.value))
}

watch(topProductsFilter, loadTopProducts)

// Al volver a la pestaña se recarga todo, así "hoy" no se queda en el día
// anterior si la pestaña quedó abierta cruzando la medianoche. Si la carga
// anterior sigue en curso no se lanza otra (cambios rápidos de pestaña).
function refreshOnVisible() {
    if (document.visibilityState !== 'visible') return

    const dashboardLoading = dashboard.lowStockLoading || dashboard.activeQuotesLoading
    if (!dashboardLoading) dashboard.fetchDashboardData()
    if (!dashboard.topProductsLoading) loadTopProducts()
}

// Sin `initialized`: el dashboard se consulta en cada visita.
onMounted(() => {
    dashboard.fetchDashboardData()
    loadTopProducts()
    document.addEventListener('visibilitychange', refreshOnVisible)
})

onUnmounted(() => {
    document.removeEventListener('visibilitychange', refreshOnVisible)
})
</script>

<style scoped>

</style>
