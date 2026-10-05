import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/lib/axios'

export const useQuotesStore = defineStore('quotes', () => {
	const quotes = ref([])
	const loading = ref(false)
	const error = ref(null)
	const initialized = ref(false)

	// Detalle de una sola cotización (con items + producto). Va en su propio
	// ref y con loading/error propios: es un registro completo, no el resumen
	// del listado, y no debe pisar el estado de fetchQuotes().
	const currentQuote = ref(null)
	const currentQuoteLoading = ref(false)
	const currentQuoteError = ref(null)

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

	// GET /api/quotes/{id} ya eager-loadea items.productVariant.product,
	// customer y quoteStatus server-side, no necesita `?with=`.
	async function fetchQuote(id) {
		if (currentQuote.value && String(currentQuote.value.id) !== String(id)) {
			currentQuote.value = null
		}

		currentQuoteLoading.value = true
		currentQuoteError.value = null

		try {
			const { data } = await axios.get(`/api/quotes/${id}`)
			currentQuote.value = data.data
		} catch (err) {
			currentQuoteError.value = err.response?.status === 404
				? 'La cotización no existe.'
				: 'No se pudo cargar la cotización.'
			console.error(err)
		} finally {
			currentQuoteLoading.value = false
		}
	}

	// POST /api/quotes crea la cotización junto con sus líneas en un solo request
	// (folio, status y totales se resuelven server-side). La respuesta ya trae
	// items.productVariant + customer + quoteStatus cargados, así que se agrega
	// directo al array in-place en vez de un refetch completo del listado.
	async function createQuote(payload) {
		const { data } = await axios.post('/api/quotes', payload)
		quotes.value.unshift(data.data)
		return data.data
	}

	return {
		quotes,
		loading,
		error,
		initialized,
		fetchQuotes,
		createQuote,
		currentQuote,
		currentQuoteLoading,
		currentQuoteError,
		fetchQuote,
	}
})
