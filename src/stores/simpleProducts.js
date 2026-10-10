import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/lib/axios'

export const useSimpleProductsStore = defineStore('simpleProducts', () => {
	const simpleProducts = ref([])
	const loading = ref(false)
	const error = ref(null)
	const initialized = ref(false)

	async function fetchSimpleProducts() {
		loading.value = true
		error.value = null

		try {
			const { data } = await axios.get('/api/simple-products')
			simpleProducts.value = data.data
			initialized.value = true
		} catch (err) {
			error.value = 'No se pudieron cargar los productos.'
			console.error(err)
		} finally {
			loading.value = false
		}
	}

	// Detalle para el form de edición: siempre se pide al backend (no se toma del
	// listado cacheado) para no editar sobre un stock desactualizado.
	async function fetchSimpleProduct(id) {
		const { data } = await axios.get(`/api/simple-products/${id}`)
		return data.data
	}

	// Mutación puntual: el backend lista por id, así que el nuevo va al final.
	async function createSimpleProduct(payload) {
		const { data } = await axios.post('/api/simple-products', payload)
		if (initialized.value) simpleProducts.value.push(data.data)
		return data.data
	}

	async function updateSimpleProduct(id, payload) {
		const { data } = await axios.put(`/api/simple-products/${id}`, payload)
		replaceInPlace(id, data.data)
		return data.data
	}

	// Lo llama quien abra StockAdjustDialog con la respuesta del PATCH de stock.
	function updateSimpleProductStock(id, updates) {
		const simpleProduct = simpleProducts.value.find((p) => String(p.id) === String(id))
		if (simpleProduct) Object.assign(simpleProduct, updates)
	}

	function replaceInPlace(id, simpleProduct) {
		const index = simpleProducts.value.findIndex((p) => String(p.id) === String(id))
		if (index !== -1) simpleProducts.value[index] = simpleProduct
	}

	return {
		simpleProducts,
		loading,
		error,
		initialized,
		fetchSimpleProducts,
		fetchSimpleProduct,
		createSimpleProduct,
		updateSimpleProduct,
		updateSimpleProductStock,
	}
})
