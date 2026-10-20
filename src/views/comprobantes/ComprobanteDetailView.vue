<template>
    <div class="p-2 max-w-5xl">
        <div v-if="comprobantes.currentComprobanteLoading && !comprobante" class="text-text-muted text-sm">
            Cargando comprobante…
        </div>

        <div v-else-if="comprobantes.currentComprobanteError" class="space-y-4">
            <p class="text-danger text-sm">{{ comprobantes.currentComprobanteError }}</p>
            <button
                type="button"
                @click="goBack"
                class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
            >
                Volver
            </button>
        </div>

        <template v-else-if="comprobante">
            <!-- Header -->
            <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div class="flex items-start gap-3">
                    <!-- Volver en línea con el título, mismo patrón que SaleDetailView.
					     Por debajo de lg solo la flecha. -->
                    <RouterLink
                        :to="{ name: 'comprobantes.index', query: comprobantes.listQuery }"
                        aria-label="Volver a comprobantes"
                        title="Volver a comprobantes"
                        class="shrink-0 inline-flex items-center justify-center gap-1.5 h-8 w-8 lg:w-auto lg:px-3 bg-surface border border-border hover:bg-bg text-text-muted hover:text-text text-sm font-medium rounded-md transition-colors select-none"
                    >
                        <i class="ti ti-arrow-left text-base" aria-hidden="true"></i>
                        <span class="hidden lg:inline">Volver</span>
                    </RouterLink>
                    <div>
                        <h1 class="font-serif text-xl text-primary">{{ comprobante.folio }}</h1>
                        <!-- La fecha es lo único editable del comprobante, sin límite -->
                        <p class="text-sm text-text-muted mt-0.5 flex items-center gap-1">
                            Fecha: {{ formatDateOnly(comprobante.date) }}
                            <button
                                type="button"
                                @click="openDateDialog"
                                aria-label="Cambiar fecha"
                                title="Cambiar fecha"
                                class="inline-flex items-center p-1 rounded text-text-muted hover:bg-bg hover:text-accent transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                            >
                                <i class="ti ti-pencil text-sm" aria-hidden="true"></i>
                            </button>
                        </p>
                    </div>
                </div>

                <div class="flex flex-col items-end gap-1.5">
                    <div class="flex flex-wrap items-center justify-end gap-3">
                        <!-- Por debajo de sm solo ícono, igual que en SaleDetailView -->
                        <button
                            v-if="canShareFiles"
                            type="button"
                            :disabled="pdfBusy"
                            @click="sharePdf"
                            aria-label="Compartir"
                            title="Compartir"
                            class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-3 sm:px-4 rounded-md transition-colors select-none cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-surface disabled:cursor-not-allowed"
                        >
                            <i class="ti ti-share text-base" aria-hidden="true"></i>
                            <span class="hidden sm:inline">Compartir</span>
                        </button>
                        <button
                            type="button"
                            :disabled="pdfBusy"
                            @click="downloadPdf"
                            aria-label="Descargar PDF"
                            title="Descargar PDF"
                            class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-10 px-3 sm:px-4 rounded-md transition-colors select-none cursor-pointer inline-flex items-center gap-2 disabled:bg-primary/50 disabled:cursor-not-allowed"
                        >
                            <i class="ti ti-download text-base" aria-hidden="true"></i>
                            <span class="hidden sm:inline">{{
                                pdfBusy ? "Generando PDF…" : "Descargar PDF"
                            }}</span>
                        </button>
                    </div>
                    <p v-if="pdfError" class="text-danger text-xs">{{ pdfError }}</p>
                </div>
            </div>

            <div class="space-y-4">
                <!-- Datos generales -->
                <div class="bg-surface border border-border rounded-md p-5 sm:p-6">
                    <h2 class="text-xs font-medium uppercase tracking-wide text-text-muted mb-4">
                        Datos generales
                    </h2>

                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div class="space-y-1">
                            <dt class="text-xs font-medium text-text-muted">Cliente</dt>
                            <dd v-if="comprobante.customer" class="text-text">
                                <div class="font-medium">{{ comprobante.customer.name }}</div>
                                <div v-if="customerAddress" class="text-text-muted">{{ customerAddress }}</div>
                                <a
                                    v-if="comprobante.customer.phone"
                                    :href="`tel:${comprobante.customer.phone}`"
                                    class="block w-fit text-text-muted text-sm hover:text-text hover:underline"
                                >
                                    {{ comprobante.customer.phone }}
                                </a>
                            </dd>
                            <dd v-else class="text-text-muted">Sin cliente</dd>
                        </div>

                        <!-- Contraparte de "Convertido en comprobante" en QuoteDetailView -->
                        <div v-if="comprobante.quote" class="space-y-1">
                            <dt class="text-xs font-medium text-text-muted">Generado desde presupuesto</dt>
                            <dd>
                                <RouterLink
                                    :to="{ name: 'quotes.show', params: { id: comprobante.quote.id } }"
                                    class="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                                >
                                    {{ comprobante.quote.folio }}
                                    <i class="ti ti-arrow-up-right text-sm" aria-hidden="true"></i>
                                </RouterLink>
                            </dd>
                        </div>
                    </dl>
                </div>

                <!-- Líneas -->
                <div class="bg-surface border border-border rounded-md overflow-hidden">
                    <h2
                        class="text-xs font-medium uppercase tracking-wide text-text-muted px-5 sm:px-6 pt-5 sm:pt-6 mb-4"
                    >
                        Productos
                    </h2>

                    <DocumentItemsTable :items="comprobante.items" line-total-label="Importe" />

                    <!-- Totales: el comprobante no guarda desglose de descuento/envío/anticipo -->
                    <div class="border-t border-border px-5 sm:px-6 py-4 flex justify-end">
                        <div class="w-full max-w-sm space-y-1.5">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-text-muted">Subtotal</span>
                                <span class="text-text">{{ formatCurrency(comprobante.subtotal) }}</span>
                            </div>
                            <div class="flex items-center justify-between text-sm font-medium">
                                <span class="text-text">Total</span>
                                <span class="text-text">{{ formatCurrency(comprobante.total) }}</span>
                            </div>
                            <p class="text-xs text-text-muted text-right uppercase">{{ comprobante.total_in_words }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- Cambiar fecha: único campo editable, se guarda al momento (PATCH propio) -->
        <Dialog
            v-model:visible="dateDialogVisible"
            modal
            :pt="{ mask: { class: 'bg-primary/50' } }"
            @show="focusDateInput"
        >
            <template #container="{ closeCallback }">
                <form @submit.prevent="saveDate" class="bg-surface border border-border rounded-md p-4 sm:p-5 w-90 max-w-[90vw]">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-serif text-base text-primary">Cambiar fecha</h3>
                        <button
                            type="button"
                            @click="closeCallback"
                            class="text-text-muted hover:text-text transition-colors cursor-pointer"
                            aria-label="Cerrar"
                        >
                            <i class="ti ti-x text-base" aria-hidden="true"></i>
                        </button>
                    </div>

                    <div class="space-y-1.5 mb-4">
                        <FieldLabel html-for="comprobante_date" text="Fecha del comprobante" required />
                        <InputTextCustom
                            id="comprobante_date"
                            v-model="dateForm"
                            type="date"
                            :error="dateError"
                            @input="dateError = ''"
                        />
                        <p v-if="dateError" class="text-danger text-xs mt-1.5">{{ dateError }}</p>
                    </div>

                    <div class="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            @click="closeCallback"
                            class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            :disabled="savingDate"
                            class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer disabled:cursor-not-allowed"
                        >
                            {{ savingDate ? 'Guardando…' : 'Guardar' }}
                        </button>
                    </div>
                </form>
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Dialog from "primevue/dialog";
import { useComprobantesStore } from "@/stores/comprobantes";
import DocumentItemsTable from "@/components/widgets/tables/DocumentItemsTable.vue";
import InputTextCustom from "@/components/widgets/InputTextCustom.vue";
import FieldLabel from "@/components/widgets/labels/FieldLabel.vue";
import { useDocumentPdf } from "@/composables/useDocumentPdf";
import { useNotify } from "@/composables/useNotify";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatDateOnly } from "@/lib/dates";

const route = useRoute();
const router = useRouter();
const comprobantes = useComprobantesStore();
const notify = useNotify();

// Evita mostrar por un instante un comprobante distinto si el store aún trae
// el de una visita anterior.
const comprobante = computed(() => {
    const current = comprobantes.currentComprobante;
    return current && String(current.id) === String(route.params.id) ? current : null;
});

const {
    canShareFiles,
    pdfBusy,
    pdfError,
    downloadPdf,
    sharePdf,
    reset: resetPdf,
} = useDocumentPdf({
    fetchPdf: comprobantes.fetchComprobantePdf,
    filePrefix: "Comprobante",
    id: () => route.params.id,
    document: comprobante,
});

watch(
    () => route.params.id,
    (id) => {
        resetPdf();
        dateDialogVisible.value = false;
        if (id) comprobantes.fetchComprobante(id);
    },
    { immediate: true },
);

const customerAddress = computed(() => {
    const customer = comprobante.value?.customer;
    if (!customer) return "";
    const cp = customer.postal_code ? `C.P. ${customer.postal_code}` : null;
    return [customer.address, customer.neighborhood, customer.city, cp].filter(Boolean).join(", ");
});

// Diálogo de fecha. String "YYYY-MM-DD" del input date.
const dateDialogVisible = ref(false);
const dateForm = ref("");
const dateError = ref("");
const savingDate = ref(false);

function openDateDialog() {
    dateForm.value = comprobante.value.date;
    dateError.value = "";
    dateDialogVisible.value = true;
}

// Con la plantilla #container PrimeVue no enfoca nada dentro del diálogo.
function focusDateInput() {
    document.getElementById("comprobante_date")?.focus();
}

async function saveDate() {
    // El PATCH exige `date` (a diferencia de la creación, aquí no hay default).
    if (!dateForm.value) {
        dateError.value = "Este campo es requerido";
        focusDateInput();
        return;
    }

    // Sin cambios: solo se cierra, sin request ni aviso.
    if (dateForm.value === comprobante.value.date) {
        dateDialogVisible.value = false;
        return;
    }

    savingDate.value = true;

    // El PDF cacheado trae la fecha anterior. Se descarta antes del PATCH: al
    // reemplazarse el comprobante en el store, useDocumentPdf lo vuelve a
    // precargar (si se descartara después, se perdería esa precarga).
    resetPdf();

    try {
        const updated = await comprobantes.updateComprobanteDate(comprobante.value.id, dateForm.value);
        dateDialogVisible.value = false;
        notify.success("Fecha actualizada", `${updated.folio}: ${formatDateOnly(updated.date)}`);
    } catch (err) {
        console.error(err);
        dateError.value =
            err.response?.status === 422
                ? (err.response.data.errors?.date?.[0] ?? err.response.data.message)
                : "No se pudo guardar la fecha. Intenta de nuevo.";
    } finally {
        savingDate.value = false;
    }
}

function goBack() {
    router.push({ name: "comprobantes.index", query: comprobantes.listQuery });
}
</script>

<style scoped></style>
