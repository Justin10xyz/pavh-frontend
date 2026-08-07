import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/lib/axios'

export const useCatalogsStore = defineStore('catalogs', () => {
	const suppliers = ref([])
	const categories = ref([])
	const unitTypes = ref([])
	const commissionCategories = ref([])
	const loading = ref(false)
	const error = ref(null)
	const initialized = ref(false)

	async function fetchCatalogs() {
		if (initialized.value) return

		loading.value = true
		error.value = null

		try {
			const [suppliersRes, categoriesRes, unitTypesRes, commissionCategoriesRes] = await Promise.all([
				axios.get('/api/suppliers'),
				axios.get('/api/categories'),
				axios.get('/api/unit-types'),
				axios.get('/api/commission-categories'),
			])

			suppliers.value = suppliersRes.data.data
			categories.value = categoriesRes.data.data
			unitTypes.value = unitTypesRes.data.data
			commissionCategories.value = commissionCategoriesRes.data.data
			initialized.value = true
		} catch (err) {
			error.value = 'No se pudieron cargar los catálogos.'
			console.error(err)
		} finally {
			loading.value = false
		}
	}

	return {
		suppliers,
		categories,
		unitTypes,
		commissionCategories,
		loading,
		error,
		initialized,
		fetchCatalogs,
	}
})
