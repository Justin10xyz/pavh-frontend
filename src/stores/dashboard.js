import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from '@/lib/axios'
import { useInventoryStore } from '@/stores/inventory'

// Fecha local en YYYY-MM-DD; toISOString() la convertiría a UTC y en la noche
// podría correrse al día siguiente. Mismo criterio que SalesView.vue.
function toDateParam(date) {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

// Rangos de calendario terminando hoy; la semana empieza en lunes (igual que
// los filtros rápidos de SalesView.vue, para que los montos coincidan).
function dashboardRanges() {
	const today = new Date()
	const to = toDateParam(today)

	const monday = new Date(today)
	monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))

	return {
		today: { from: to, to },
		week: { from: toDateParam(monday), to },
		month: { from: toDateParam(new Date(today.getFullYear(), today.getMonth(), 1)), to },
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
	const loading = ref(false)
	const error = ref(null)

	// Sin `initialized`: el dashboard se refresca en cada visita (mismo criterio
	// que sales.js). Si se vuelve a llamar antes de que responda la anterior,
	// solo la más reciente puede escribir en el estado.
	let lastRequestId = 0

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

	// Inventario cambia poco y ya se cachea con `initialized`; fetchProducts() no
	// lanza, deja el error en el store, así que se convierte a excepción aquí.
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

	async function fetchDashboardData() {
		const requestId = ++lastRequestId
		loading.value = true
		error.value = null

		try {
			const [summary, , quotes] = await Promise.all([
				fetchSalesSummary(),
				ensureInventory(),
				fetchActiveQuotes(),
			])
			if (requestId !== lastRequestId) return
			salesSummary.value = summary
			activeQuotes.value = quotes
		} catch (err) {
			if (requestId !== lastRequestId) return
			error.value = 'No se pudo cargar el resumen del dashboard.'
			console.error(err)
		} finally {
			if (requestId === lastRequestId) loading.value = false
		}
	}

	return {
		salesSummary,
		lowStockVariants,
		activeQuotes,
		loading,
		error,
		fetchDashboardData,
	}
})
