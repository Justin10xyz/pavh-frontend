import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from '@/lib/axios'
import { useInventoryStore } from '@/stores/inventory'
import { dateRangeFor } from '@/lib/dateRanges'

// Mismos rangos que los filtros rápidos de SalesView.vue, para que los montos coincidan.
function dashboardRanges() {
    return {
        today: dateRangeFor('today'),
        week: dateRangeFor('week'),
        month: dateRangeFor('month'),
    }
}

// `total` llega como string decimal desde Laravel; se suma en centavos para no
// arrastrar error de punto flotante.
function sumTotals(sales) {
    const cents = sales.reduce((acc, sale) => acc + Math.round(Number(sale.total) * 100), 0)
    return cents / 100
}

export const useDashboardStore = defineStore('dashboard', () => {
    const inventory = useInventoryStore()

    const salesSummary = ref({ today: 0, week: 0, month: 0 })
    const activeQuotes = ref([])
    const topProducts = ref([])

    // Loading/error por widget: cada sección puede fallar sin ocultar a las otras.
    const salesLoading = ref(false)
    const salesError = ref(null)
    const lowStockLoading = ref(false)
    const lowStockError = ref(null)
    const activeQuotesLoading = ref(false)
    const activeQuotesError = ref(null)
    const topProductsLoading = ref(false)
    const topProductsError = ref(null)

    // Sin `initialized`: el dashboard se refresca en cada visita (mismo criterio
    // que sales.js). Si se vuelve a llamar antes de que responda la anterior,
    // solo la más reciente puede escribir en el estado.
    let lastRequestId = 0
    // Contador propio: Productos más vendidos se vuelve a pedir al cambiar su
    // filtro de fecha, y eso no debe descartar las cargas en curso de los otros
    // widgets (ni al revés).
    let lastTopProductsRequestId = 0

    // Derivado del store de Inventario (no copiado): así refleja también los
    // ajustes de stock in-place que se hagan desde Inventario o POS.
    const lowStockVariants = computed(() =>
        inventory.products.flatMap((product) =>
            (product.variants ?? [])
                .filter((variant) => variant.low_stock === true)
                .map((variant) => ({ ...variant, product: { id: product.id, name: product.name } }))
        )
    )

    // Se usa axios directo en vez de sales.fetchSales(): ese método escribe en
    // `sales.sales` (el listado de SalesView) y su contador de petición descartaría
    // dos de las tres consultas paralelas.
    async function fetchSalesTotal({ from, to }) {
        const { data } = await axios.get('/api/sales', { params: { from, to } })
        return sumTotals(data.data)
    }

    async function fetchSalesSummary() {
        const ranges = dashboardRanges()
        const [today, week, month] = await Promise.all([
            fetchSalesTotal(ranges.today),
            fetchSalesTotal(ranges.week),
            fetchSalesTotal(ranges.month),
        ])
        return { today, week, month }
    }

    // fetchProducts() no revisa `initialized`: vuelve a pedir el catálogo en cada
    // visita, así Stock bajo nunca se queda viejo. No lanza, deja el error en el
    // store, así que se convierte a excepción aquí.
    async function ensureInventory() {
        await inventory.fetchProducts()
        if (inventory.error) throw new Error(inventory.error)
    }

    // Directo al endpoint en vez de quotes.fetchQuotes(): ese listado está cacheado
    // con `initialized` y no refleja conversiones hechas después (ver PROJECT.md).
    async function fetchActiveQuotes() {
        const { data } = await axios.get('/api/quotes', { params: { with: 'customer,quoteStatus' } })
        // QuoteResource expone el nombre del status como `status` (string).
        return data.data.filter((quote) => quote.status === 'Borrador')
    }

    // Sin from/to (filtro "Todas") el backend no filtra por fecha. El backend ya
    // ordena por monto y limita a 5 filas.
    async function fetchTopProductsData(range) {
        const { data } = await axios.get('/api/dashboard/top-products', { params: range ?? {} })
        return data.data
    }

    // Corre una carga con su propio loading/error. `isCurrent` indica si sigue
    // siendo la petición más reciente de su contador. Si falla, sus datos no se
    // tocan (se quedan en su valor anterior o vacío).
    async function loadSection(isCurrent, { loading, error, message, load, apply }) {
        loading.value = true
        error.value = null

        try {
            const result = await load()
            if (!isCurrent()) return
            apply?.(result)
        } catch (err) {
            if (!isCurrent()) return
            error.value = message
            console.error(err)
        } finally {
            if (isCurrent()) loading.value = false
        }
    }

    // allSettled: ninguna carga cancela a las otras. Cada sección actualiza su
    // estado en cuanto responde, sin esperar a las demás.
    async function fetchDashboardData() {
        const requestId = ++lastRequestId
        const isCurrent = () => requestId === lastRequestId

        await Promise.allSettled([
            loadSection(isCurrent, {
                loading: salesLoading,
                error: salesError,
                message: 'No se pudo cargar el resumen de ventas.',
                load: fetchSalesSummary,
                apply: (summary) => { salesSummary.value = summary },
            }),
            // lowStockVariants es un computed sobre Inventario, no hay nada que asignar.
            loadSection(isCurrent, {
                loading: lowStockLoading,
                error: lowStockError,
                message: 'No se pudieron cargar las alertas de stock bajo.',
                load: ensureInventory,
            }),
            loadSection(isCurrent, {
                loading: activeQuotesLoading,
                error: activeQuotesError,
                message: 'No se pudieron cargar las cotizaciones activas.',
                load: fetchActiveQuotes,
                apply: (quotes) => { activeQuotes.value = quotes },
            }),
        ])
    }

    // `range` es { from, to } o null (sin filtro), según el filtro de fecha activo
    // del widget. Separado de fetchDashboardData() porque se vuelve a llamar sola
    // al cambiar el filtro.
    async function fetchTopProducts(range) {
        const requestId = ++lastTopProductsRequestId

        await loadSection(() => requestId === lastTopProductsRequestId, {
            loading: topProductsLoading,
            error: topProductsError,
            message: 'No se pudieron cargar los productos más vendidos.',
            load: () => fetchTopProductsData(range),
            apply: (products) => { topProducts.value = products },
        })
    }

    return {
        salesSummary,
        lowStockVariants,
        activeQuotes,
        topProducts,
        salesLoading,
        salesError,
        lowStockLoading,
        lowStockError,
        activeQuotesLoading,
        activeQuotesError,
        topProductsLoading,
        topProductsError,
        fetchDashboardData,
        fetchTopProducts,
    }
})
