import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "@/lib/axios";

export const useQuotesStore = defineStore("quotes", () => {
    const quotes = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const initialized = ref(false);
    // Último query del listado (ej. { estado: "Borrador" }), para que el
    // "Volver" del detalle regrese con el mismo filtro. Lo escribe QuotesView.
    const listQuery = ref({});

    // Detalle de una sola cotización (con items + producto). Va en su propio
    // ref y con loading/error propios: es un registro completo, no el resumen
    // del listado, y no debe pisar el estado de fetchQuotes().
    const currentQuote = ref(null);
    const currentQuoteLoading = ref(false);
    const currentQuoteError = ref(null);

    // QuoteController@index solo soporta `?with=items` (carga items.productVariant).
    // `customer` y `quoteStatus.name` no requieren `with`: QuoteResource los
    // accede siempre, así que Eloquent los lazy-loads y ya vienen en la respuesta.
    async function fetchQuotes({ force = false } = {}) {
        if (initialized.value && !force) return;

        loading.value = true;
        error.value = null;

        try {
            const { data } = await axios.get("/api/quotes?with=customer,quoteStatus");
            quotes.value = data.data;
            initialized.value = true;
        } catch (err) {
            error.value = "No se pudieron cargar los presupuestos.";
            console.error(err);
        } finally {
            loading.value = false;
        }
    }

    // GET /api/quotes/{id} ya eager-loadea items.productVariant.product,
    // customer y quoteStatus server-side, no necesita `?with=`.
    async function fetchQuote(id) {
        if (currentQuote.value && String(currentQuote.value.id) !== String(id)) {
            currentQuote.value = null;
        }

        currentQuoteLoading.value = true;
        currentQuoteError.value = null;

        try {
            const { data } = await axios.get(`/api/quotes/${id}`);
            currentQuote.value = data.data;
        } catch (err) {
            currentQuoteError.value =
				err.response?.status === 404
				    ? "El presupuesto no existe."
				    : "No se pudo cargar el presupuesto.";
            console.error(err);
        } finally {
            currentQuoteLoading.value = false;
        }
    }

    // POST /api/quotes crea la cotización junto con sus líneas en un solo request
    // (folio, status y totales se resuelven server-side). La respuesta ya trae
    // items.productVariant + customer + quoteStatus cargados, así que se agrega
    // directo al array in-place en vez de un refetch completo del listado.
    async function createQuote(payload) {
        const { data } = await axios.post("/api/quotes", payload);
        quotes.value.unshift(data.data);
        return data.data;
    }

    // PUT /api/quotes/{id} reemplaza todas las líneas. Se actualiza el registro
    // in-place tanto en el detalle como en el listado, sin refetch completo.
    async function updateQuote(id, payload) {
        const { data } = await axios.put(`/api/quotes/${id}`, payload);
        currentQuote.value = data.data;

        const index = quotes.value.findIndex((q) => String(q.id) === String(id));
        if (index !== -1) quotes.value[index] = data.data;

        return data.data;
    }

    // PATCH /api/quotes/{id}/cancel solo cambia el status (responde 422 si no
    // está en Borrador). Mismo update in-place que updateQuote(), pero en el
    // detalle se conservan los items ya cargados: la respuesta no eager-loadea
    // items.productVariant.product y cancelar no toca las líneas.
    async function cancelQuote(id) {
        const { data } = await axios.patch(`/api/quotes/${id}/cancel`);

        if (currentQuote.value && String(currentQuote.value.id) === String(id)) {
            currentQuote.value = { ...data.data, items: currentQuote.value.items };
        }

        const index = quotes.value.findIndex((q) => String(q.id) === String(id));
        if (index !== -1) quotes.value[index] = data.data;

        return data.data;
    }

    // DELETE /api/quotes/{id} (soft delete) responde 204, o 422 si está pagada o
    // ya tiene venta/comprobante. Se quita del listado in-place, sin refetch.
    async function deleteQuote(id) {
        await axios.delete(`/api/quotes/${id}`);

        quotes.value = quotes.value.filter((q) => String(q.id) !== String(id));

        if (currentQuote.value && String(currentQuote.value.id) === String(id)) {
            currentQuote.value = null;
        }
    }

    // La conversión ocurre en POST /api/sales con quote_id (SaleFormView), cuya
    // respuesta no trae el quote completo: solo {id, folio}. El backend la marca
    // "Convertida" en la misma transacción, así que un POST exitoso basta para
    // actualizar el status in-place sin refetch del listado.
    function markQuoteConverted(id) {
        const quote = quotes.value.find((q) => String(q.id) === String(id));
        if (quote) quote.status = "Convertida";

        if (currentQuote.value && String(currentQuote.value.id) === String(id)) {
            currentQuote.value.status = "Convertida";
        }
    }

    // PATCH /api/quotes/{id}/mark-paid (sin payload) descuenta stock, pasa el
    // status a "Pagada" y llena paid_at/paid_by; responde 422 si no es pagable.
    // Solo se copian esos tres campos in-place, mismo criterio que
    // markQuoteConverted(): la respuesta no eager-loadea items.productVariant.product.
    async function markQuotePaid(id) {
        const { data } = await axios.patch(`/api/quotes/${id}/mark-paid`);
        const paid = { status: data.data.status, paid_at: data.data.paid_at, paid_by: data.data.paid_by };

        const quote = quotes.value.find((q) => String(q.id) === String(id));
        if (quote) Object.assign(quote, paid);

        if (currentQuote.value && String(currentQuote.value.id) === String(id)) {
            Object.assign(currentQuote.value, paid);
        }

        return data.data;
    }

    // La conversión ocurre en POST /api/comprobantes (ComprobanteFormView), cuya
    // respuesta es el comprobante, no la cotización. Solo el detalle expone
    // `comprobante` (id+folio, vía whenLoaded en show), así que el listado no se toca.
    function markQuoteComprobante(id, comprobante) {
        if (currentQuote.value && String(currentQuote.value.id) === String(id)) {
            currentQuote.value.comprobante = comprobante;
        }
    }

    async function fetchQuotePdf(id) {
        const response = await axios.get(`/api/quotes/${id}/pdf`, { responseType: "blob" });
        return response.data;
    }

    return {
        quotes,
        loading,
        error,
        initialized,
        listQuery,
        fetchQuotes,
        createQuote,
        updateQuote,
        cancelQuote,
        deleteQuote,
        markQuoteConverted,
        markQuotePaid,
        markQuoteComprobante,
        currentQuote,
        currentQuoteLoading,
        currentQuoteError,
        fetchQuote,
        fetchQuotePdf,
    };
});
