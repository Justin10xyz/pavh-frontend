import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/lib/axios'

export const useInventoryStore = defineStore('inventory', () => {
	const products = ref([])
	const loading = ref(false)
	const error = ref(null)
	const initialized = ref(false)

	async function fetchProducts() {
		loading.value = true
		error.value = null

		try {
			const { data } = await axios.get('/api/products', {
				params: { with: 'variants' }
			})
			products.value = data.data
			initialized.value = true
		} catch (err) {
			error.value = 'No se pudieron cargar los productos.'
			console.error(err)
		} finally {
			loading.value = false
		}
	}

	return { products, loading, error, initialized, fetchProducts }
})
