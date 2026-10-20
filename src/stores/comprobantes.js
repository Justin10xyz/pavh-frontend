import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "@/lib/axios";

// Comprobantes Fiscales Simplificados: se crean convirtiendo una cotización
// pagada y después solo se consultan (la fecha es lo único editable).
export const useComprobantesStore = defineStore("comprobantes", () => {
    const comprobantes = ref([]);
    const loading = ref(false);
    const error = ref(null);
    // Sin flag `initialized`: los comprobantes se generan desde otra pantalla
    // (ComprobanteFormView), así que el listado siempre se consulta al entrar,
    // mismo criterio que sales.js.

    // Último query del listado, para que "Volver" del detalle lo respete
    // (mismo criterio que quotes.listQuery / sales.listQuery). Hoy el listado
    // no tiene filtros en la URL, pero así el detalle no depende de eso.
    const listQuery = ref({});

    // Detalle de un solo comprobante, con loading/error propios: no pisa el listado.
    const currentComprobante = ref(null);
    const currentComprobanteLoading = ref(false);
    const currentComprobanteError = ref(null);

    // Sin `items`: el listado no los muestra.
    async function fetchComprobantes() {
        loading.value = true;
        error.value = null;

        try {
            const { data } = await axios.get("/api/comprobantes", { params: { with: "customer" } });
            comprobantes.value = data.data;
        } catch (err) {
            error.value = "No se pudieron cargar los comprobantes.";
            console.error(err);
        } finally {
            loading.value = false;
        }
    }

    // GET /api/comprobantes/{id} ya eager-loadea líneas, cliente y cotización
    // de origen server-side, no necesita `?with=`.
    async function fetchComprobante(id) {
        if (currentComprobante.value && String(currentComprobante.value.id) !== String(id)) {
            currentComprobante.value = null;
        }

        currentComprobanteLoading.value = true;
        currentComprobanteError.value = null;

        try {
            const { data } = await axios.get(`/api/comprobantes/${id}`);
            currentComprobante.value = data.data;
        } catch (err) {
            currentComprobanteError.value =
                err.response?.status === 404 ? "El comprobante no existe." : "No se pudo cargar el comprobante.";
            console.error(err);
        } finally {
            currentComprobanteLoading.value = false;
        }
    }

    // POST /api/comprobantes solo recibe quote_id y la fecha (opcional, hoy si
    // no llega): líneas, montos, folio y total con letra se copian/generan
    // server-side. Responde 422 si la cotización no está pagada o ya tiene
    // comprobante.
    async function createComprobante(payload) {
        const { data } = await axios.post("/api/comprobantes", payload);
        return data.data;
    }

    // PATCH /api/comprobantes/{id} solo acepta `date`. Solo se copia la fecha:
    // la respuesta no eager-loadea items.productVariant.product, que el detalle
    // necesita para distinguir pisos por pieza. En el detalle se reemplaza el
    // objeto (no se muta) para que useDocumentPdf vuelva a precargar el PDF,
    // que ahora lleva otra fecha.
    async function updateComprobanteDate(id, date) {
        const { data } = await axios.patch(`/api/comprobantes/${id}`, { date });

        if (currentComprobante.value && String(currentComprobante.value.id) === String(id)) {
            currentComprobante.value = { ...currentComprobante.value, date: data.data.date };
        }

        const comprobante = comprobantes.value.find((c) => String(c.id) === String(id));
        if (comprobante) comprobante.date = data.data.date;

        return data.data;
    }

    // Devuelve el PDF como Blob; descargarlo o compartirlo lo decide la vista.
    async function fetchComprobantePdf(id) {
        const { data } = await axios.get(`/api/comprobantes/${id}/pdf`, { responseType: "blob" });
        return data;
    }

    return {
        comprobantes,
        loading,
        error,
        listQuery,
        currentComprobante,
        currentComprobanteLoading,
        currentComprobanteError,
        fetchComprobantes,
        fetchComprobante,
        createComprobante,
        updateComprobanteDate,
        fetchComprobantePdf,
    };
});
