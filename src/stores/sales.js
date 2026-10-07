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

	async function createSale(payload) {
		const { data } = await axios.post('/api/sales', payload)
		return data.data
	}

	return { sales, loading, error, initialized, fetchSales, createSale }
})
