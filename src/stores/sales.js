import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/lib/axios'

export const useSalesStore = defineStore('sales', () => {
	const sales = ref([])
	const loading = ref(false)
	const error = ref(null)
	// Solo indica que ya hubo una carga inicial (para que la vista evite un
	// doble-fetch al montar). NO bloquea fetchSales(): a diferencia de
	// inventory/quotes, cada cambio de rango de fechas es una consulta distinta
	// y siempre debe ir al backend.
	const initialized = ref(false)

	// Si el usuario cambia el filtro antes de que responda la consulta anterior,
	// solo la respuesta más reciente puede escribir en el estado.
	let lastRequestId = 0

	// Detalle de una sola venta, en su propio ref con loading/error propios
	// (mismo criterio que currentQuote en quotes.js): no pisa el listado.
	const currentSale = ref(null)
	const currentSaleLoading = ref(false)
	const currentSaleError = ref(null)

	async function fetchSales({ from, to } = {}) {
		const requestId = ++lastRequestId
		loading.value = true
		error.value = null

		const params = { with: 'customer,items' }
		if (from) params.from = from
		if (to) params.to = to

		try {
			const { data } = await axios.get('/api/sales', { params })
			if (requestId !== lastRequestId) return
			sales.value = data.data
			initialized.value = true
		} catch (err) {
			if (requestId !== lastRequestId) return
			error.value = 'No se pudieron cargar las ventas.'
			console.error(err)
		} finally {
			if (requestId === lastRequestId) loading.value = false
		}
	}

	// GET /api/sales/{id} ya eager-loadea items.productVariant y customer
	// server-side, no necesita `?with=`.
	async function fetchSale(id) {
		if (currentSale.value && String(currentSale.value.id) !== String(id)) {
			currentSale.value = null
		}

		currentSaleLoading.value = true
		currentSaleError.value = null

		try {
			const { data } = await axios.get(`/api/sales/${id}`)
			currentSale.value = data.data
		} catch (err) {
			currentSaleError.value = err.response?.status === 404
				? 'La venta no existe.'
				: 'No se pudo cargar la venta.'
			console.error(err)
		} finally {
			currentSaleLoading.value = false
		}
	}

	// Devuelve el PDF como Blob; descargarlo o compartirlo lo decide la vista.
	async function fetchSalePdf(id) {
		const { data } = await axios.get(`/api/sales/${id}/pdf`, { responseType: 'blob' })
		return data
	}

	async function createSale(payload) {
		const { data } = await axios.post('/api/sales', payload)
		return data.data
	}

	return {
		sales,
		loading,
		error,
		initialized,
		currentSale,
		currentSaleLoading,
		currentSaleError,
		fetchSales,
		fetchSale,
		fetchSalePdf,
		createSale,
	}
})
