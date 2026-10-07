import { defineStore } from 'pinia'
import axios from '@/lib/axios'

export const useSalesStore = defineStore('sales', () => {
	// Sin `sales`/`initialized` todavía: no hay listado que los consuma. Se
	// agregan junto con fetchSales() cuando exista SalesView.
	async function createSale(payload) {
		const { data } = await axios.post('/api/sales', payload)
		return data.data
	}

	return { createSale }
})
