import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/lib/axios'

export const useQuotesStore = defineStore('quotes', () => {
	const quotes = ref([])
	const loading = ref(false)
	const error = ref(null)
	const initialized = ref(false)

	// QuoteController@index solo soporta `?with=items` (carga items.productVariant).
	// `customer` y `quoteStatus.name` no requieren `with`: QuoteResource los
	// accede siempre, así que Eloquent los lazy-loads y ya vienen en la respuesta.
	async function fetchQuotes({ force = false } = {}) {
		if (initialized.value && !force) return

		loading.value = true
		error.value = null

		try {
			const { data } = await axios.get('/api/quotes?with=customer,quoteStatus')
			quotes.value = data.data
			initialized.value = true
		} catch (err) {
			error.value = 'No se pudieron cargar las cotizaciones.'
			console.error(err)
		} finally {
			loading.value = false
		}
	}

	return { quotes, loading, error, initialized, fetchQuotes }
})
