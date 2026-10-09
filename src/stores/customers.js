import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/lib/axios'

export const useCustomersStore = defineStore('customers', () => {
	const customers = ref([])
	const loading = ref(false)
	const error = ref(null)

	// Mismo criterio que sales.js: la búsqueda es server-side, cada término es
	// una consulta distinta, así que no hay gate de `initialized`. El contador
	// descarta respuestas tardías si el usuario sigue escribiendo.
	let lastRequestId = 0

	// Detalle de un solo cliente, en su propio ref con loading/error propios
	// (mismo criterio que currentQuote en quotes.js): no pisa el listado.
	const currentCustomer = ref(null)
	const currentCustomerLoading = ref(false)
	const currentCustomerError = ref(null)

	async function fetchCustomers({ search } = {}) {
		const requestId = ++lastRequestId
		loading.value = true
		error.value = null

		const params = {}
		const term = search?.trim()
		if (term) params.search = term

		try {
			const { data } = await axios.get('/api/customers', { params })
			if (requestId !== lastRequestId) return
			customers.value = data.data
		} catch (err) {
			if (requestId !== lastRequestId) return
			error.value = 'No se pudieron cargar los clientes.'
			console.error(err)
		} finally {
			if (requestId === lastRequestId) loading.value = false
		}
	}

	async function fetchCustomer(id) {
		if (currentCustomer.value && String(currentCustomer.value.id) !== String(id)) {
			currentCustomer.value = null
		}

		currentCustomerLoading.value = true
		currentCustomerError.value = null

		try {
			const { data } = await axios.get(`/api/customers/${id}`)
			currentCustomer.value = data.data
		} catch (err) {
			currentCustomerError.value = err.response?.status === 404
				? 'El cliente no existe.'
				: 'No se pudo cargar el cliente.'
			console.error(err)
		} finally {
			currentCustomerLoading.value = false
		}
	}

	// Se inserta in-place en su posición alfabética, igual que el orderBy('name')
	// de CustomerController@index, en vez de un refetch completo del listado.
	async function createCustomer(payload) {
		const { data } = await axios.post('/api/customers', payload)
		const customer = data.data

		const index = customers.value.findIndex(
			(c) => c.name.localeCompare(customer.name, 'es', { sensitivity: 'base' }) > 0
		)
		if (index === -1) customers.value.push(customer)
		else customers.value.splice(index, 0, customer)

		return customer
	}

	// Actualiza el registro in-place en el listado y en el detalle (si es el
	// mismo cliente), sin refetch completo.
	async function updateCustomer(id, payload) {
		const { data } = await axios.put(`/api/customers/${id}`, payload)

		const index = customers.value.findIndex((c) => String(c.id) === String(id))
		if (index !== -1) customers.value[index] = data.data

		if (currentCustomer.value && String(currentCustomer.value.id) === String(id)) {
			currentCustomer.value = data.data
		}

		return data.data
	}

	async function deleteCustomer(id) {
		await axios.delete(`/api/customers/${id}`)
		customers.value = customers.value.filter((c) => String(c.id) !== String(id))
	}

	return {
		customers,
		loading,
		error,
		currentCustomer,
		currentCustomerLoading,
		currentCustomerError,
		fetchCustomers,
		fetchCustomer,
		createCustomer,
		updateCustomer,
		deleteCustomer,
	}
})
