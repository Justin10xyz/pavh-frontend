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

	// Actualiza una sola variante in-place (sin refetch) para no perder el estado de
	// grupos/filas expandidas que el usuario ya tenía abiertos en la vista.
	function updateVariantStock(variantId, updates) {
		for (const product of products.value) {
			const variant = product.variants.find((v) => v.id === variantId)
			if (variant) {
				Object.assign(variant, updates)
				break
			}
		}
	}

	return { products, loading, error, initialized, fetchProducts, updateVariantStock }
})
