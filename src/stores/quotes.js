import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "@/lib/axios";
import { sortInstallments } from "@/lib/quoteInstallments";

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

    // index acepta ?with=items,customer,quoteStatus,comprobante.
    async function fetchQuotes({ force = false } = {}) {
        if (initialized.value && !force) return;

        loading.value = true;
        error.value = null;

        try {
            const { data } = await axios.get("/api/quotes?with=customer,quoteStatus,comprobante");
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

    // PATCH /api/quotes/{id}/mark-paid (sin payload) descuenta stock, pasa el
    // status a "Pagada" y llena paid_at/paid_by; responde 422 si no es pagable.
    // Solo se copian esos tres campos in-place: la respuesta no eager-loadea
    // items.productVariant.product.
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
    // respuesta es el comprobante, no la cotización: se copia id+folio in-place
    // en el detalle y en el listado, sin refetch.
    function markQuoteComprobante(id, comprobante) {
        if (currentQuote.value && String(currentQuote.value.id) === String(id)) {
            currentQuote.value.comprobante = comprobante;
        }

        const quote = quotes.value.find((q) => String(q.id) === String(id));
        if (quote) quote.comprobante = comprobante;
    }

    // Abonos: POST/DELETE responden el saldo ya recalculado (`quote`), que se
    // copia in-place en el detalle y en el listado, sin refetch. El detalle
    // además agrega o quita el abono de `installments`, en el orden del backend.
    function applyInstallmentChange(totals, updateInstallments) {
        const amounts = { installments_total: totals.installments_total, balance: totals.balance };

        const quote = quotes.value.find((q) => String(q.id) === String(totals.id));
        if (quote) Object.assign(quote, amounts);

        if (currentQuote.value && String(currentQuote.value.id) === String(totals.id)) {
            Object.assign(currentQuote.value, amounts, {
                installments: updateInstallments(currentQuote.value.installments ?? []),
            });
        }
    }

    // 422 con `errors` (validación) o solo `message` (abono mayor que el saldo,
    // cotización no abonable): lo maneja quien llama.
    async function addQuoteInstallment(quoteId, payload) {
        const { data } = await axios.post(`/api/quotes/${quoteId}/installments`, payload);
        applyInstallmentChange(data.quote, (installments) => sortInstallments([...installments, data.data]));
        return data.data;
    }

    // Anular = soft delete en el backend; aquí se quita de la lista.
    async function voidQuoteInstallment(quoteId, installmentId) {
        const { data } = await axios.delete(`/api/quotes/${quoteId}/installments/${installmentId}`);
        applyInstallmentChange(data.quote, (installments) =>
            installments.filter((installment) => installment.id !== installmentId),
        );
        return data.quote;
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
        markQuotePaid,
        markQuoteComprobante,
        addQuoteInstallment,
        voidQuoteInstallment,
        currentQuote,
        currentQuoteLoading,
        currentQuoteError,
        fetchQuote,
        fetchQuotePdf,
    };
});
