<template>
    <div class="p-2 max-w-5xl">
        <div v-if="quotes.currentQuoteLoading && !quote" class="text-text-muted text-sm">
            Cargando presupuesto…
        </div>

        <div v-else-if="quotes.currentQuoteError" class="space-y-4">
            <p class="text-danger text-sm">{{ quotes.currentQuoteError }}</p>
            <button
                type="button"
                @click="goBack"
                class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
            >
                Volver
            </button>
        </div>

        <template v-else-if="quote">
            <!-- Header -->
            <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div class="flex items-start gap-3">
                    <!-- Volver en línea con el título (antes se perdía entre las acciones).
					     Por debajo de lg solo la flecha. -->
                    <RouterLink
                        :to="{ name: 'quotes', query: quotes.listQuery }"
                        aria-label="Volver a presupuestos"
                        title="Volver a presupuestos"
                        class="shrink-0 inline-flex items-center justify-center gap-1.5 h-8 w-8 lg:w-auto lg:px-3 bg-surface border border-border hover:bg-bg text-text-muted hover:text-text text-sm font-medium rounded-md transition-colors select-none"
                    >
                        <i class="ti ti-arrow-left text-base" aria-hidden="true"></i>
                        <span class="hidden lg:inline">Volver</span>
                    </RouterLink>
                    <div>
                        <div class="flex items-center gap-2">
                            <h1 class="font-serif text-xl text-primary">{{ quote.folio }}</h1>
                            <span
                                class="text-xs px-2 py-0.5 rounded"
                                :class="statusClasses(quote.status)"
                            >
                                {{ statusLabel(quote.status) }}
                            </span>
                            <QuotePaidBadge v-if="quote.paid_at" />
                        </div>
                        <p class="text-sm text-text-muted mt-0.5">
                            Creado el {{ formatDateTime(quote.created_at) }}
                        </p>
                        <p v-if="quote.paid_at" class="text-sm text-text-muted">
                            Pagado el {{ formatDateTime(quote.paid_at) }}
                        </p>
                    </div>
                </div>

                <div class="flex flex-col items-end gap-1.5">
                    <div class="flex flex-wrap items-center justify-end gap-3">
                        <!-- Editar/Cancelar/Convertir/Marcar como pagado solo existen en
						     Borrador sin pagar: en otro caso se ocultan en vez de quedar
						     deshabilitados (el tooltip que explicaba por qué no se ve en
						     touch ni en un botón disabled). -->
                        <template v-if="isEditable">
                            <!-- Destructiva: separada del resto para no quedar junto a "Editar" -->
                            <button
                                type="button"
                                :disabled="cancelling"
                                @click="requestCancel"
                                class="bg-surface border border-danger/40 hover:bg-danger/10 text-danger font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer disabled:opacity-50 disabled:hover:bg-surface disabled:cursor-not-allowed"
                            >
                                {{ cancelling ? "Cancelando…" : "Cancelar presupuesto" }}
                            </button>
                            <span
                                class="hidden sm:block w-px h-6 bg-border"
                                aria-hidden="true"
                            ></span>
                            <button
                                type="button"
                                @click="editQuote"
                                class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                            >
                                Editar
                            </button>
                        </template>
                        <!-- Por debajo de sm solo ícono, para que las acciones no ocupen tres renglones -->
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
                            class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-3 sm:px-4 rounded-md transition-colors select-none cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-surface disabled:cursor-not-allowed"
                        >
                            <i class="ti ti-download text-base" aria-hidden="true"></i>
                            <span class="hidden sm:inline">{{
                                pdfBusy ? "Generando PDF…" : "Descargar PDF"
                            }}</span>
                        </button>
                        <!-- Venta (POS) queda como flujo secundario: la acción principal
						     del Presupuesto es marcarlo como pagado. -->
                        <template v-if="isEditable">
                            <button
                                type="button"
                                @click="convertToSale"
                                class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                            >
                                Convertir a venta
                            </button>
                            <button
                                type="button"
                                :disabled="markingPaid"
                                @click="requestMarkPaid"
                                class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer disabled:cursor-not-allowed"
                            >
                                {{ markingPaid ? "Marcando…" : "Marcar como pagado" }}
                            </button>
                        </template>
                        <!-- Pagada y sin comprobante: el guard real es
						     Quote::comprobanteConversionBlockedMessage(). -->
                        <button
                            v-if="canConvertToComprobante"
                            type="button"
                            @click="convertToComprobante"
                            class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                        >
                            Convertir a comprobante
                        </button>
                    </div>
                    <p v-if="pdfError" class="text-danger text-xs">{{ pdfError }}</p>
                    <p v-if="cancelError" class="text-danger text-xs">{{ cancelError }}</p>
                    <p v-if="markPaidError" role="alert" class="text-danger text-xs">{{ markPaidError }}</p>
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
                            <dd v-if="quote.customer" class="text-text">
                                <div class="font-medium">{{ quote.customer.name }}</div>
                                <a
                                    v-if="quote.customer.phone"
                                    :href="`tel:${quote.customer.phone}`"
                                    class="block w-fit text-text-muted text-sm hover:text-text hover:underline"
                                >
                                    {{ quote.customer.phone }}
                                </a>
                                <a
                                    v-if="quote.customer.email"
                                    :href="`mailto:${quote.customer.email}`"
                                    class="block w-fit text-text-muted text-sm hover:text-text hover:underline"
                                >
                                    {{ quote.customer.email }}
                                </a>
                            </dd>
                            <dd v-else class="text-text-muted">Sin cliente</dd>
                        </div>

                        <!-- Solo en Convertida: `sale` viene de GET /quotes/{id} (null si no se ha convertido) -->
                        <div v-if="quote.sale" class="space-y-1">
                            <dt class="text-xs font-medium text-text-muted">Convertida en venta</dt>
                            <dd>
                                <RouterLink
                                    :to="{ name: 'pos.sales.show', params: { id: quote.sale.id } }"
                                    class="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                                >
                                    {{ quote.sale.folio }}
                                    <i class="ti ti-arrow-up-right text-sm" aria-hidden="true"></i>
                                </RouterLink>
                            </dd>
                        </div>

                        <!-- `comprobante` viene de GET /quotes/{id} (null si no se ha convertido) -->
                        <div v-if="quote.comprobante" class="space-y-1">
                            <dt class="text-xs font-medium text-text-muted">Convertido en comprobante</dt>
                            <dd>
                                <RouterLink
                                    :to="{ name: 'comprobantes.show', params: { id: quote.comprobante.id } }"
                                    class="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                                >
                                    {{ quote.comprobante.folio }}
                                    <i class="ti ti-arrow-up-right text-sm" aria-hidden="true"></i>
                                </RouterLink>
                            </dd>
                        </div>

                        <div v-if="quote.notes" class="space-y-1 sm:col-span-2">
                            <dt class="text-xs font-medium text-text-muted">Notas</dt>
                            <dd class="text-text whitespace-pre-line">{{ quote.notes }}</dd>
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

                    <DocumentItemsTable :items="quote.items" />

                    <!-- Totales -->
                    <div class="border-t border-border px-5 sm:px-6 py-4 flex justify-end">
                        <div class="w-full max-w-xs space-y-1.5">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-text-muted">Subtotal</span>
                                <span class="text-text tabular-nums">{{ formatCurrency(quote.subtotal) }}</span>
                            </div>
                            <!-- El PDF ya no anota el mayoreo: aquí se recuerda junto al subtotal
							     (mismo aviso que el preview del formulario). -->
                            <p v-if="wholesaleCount > 0" class="text-xs text-text-muted">
                                Incluye precio de mayoreo en {{ wholesaleCount }}
                                {{ wholesaleCount === 1 ? "producto" : "productos" }}.
                            </p>
                            <!-- Mismo criterio que el PDF de Presupuesto: descuento, envío y
							     anticipo solo si > 0; total, saldo y forma de pago siempre. -->
                            <div v-if="Number(quote.discount) > 0" class="flex items-center justify-between text-sm">
                                <span class="text-text-muted">Descuento</span>
                                <span class="text-text tabular-nums">-{{ formatCurrency(quote.discount) }}</span>
                            </div>
                            <div v-if="Number(quote.shipping_cost) > 0" class="flex items-center justify-between text-sm">
                                <span class="text-text-muted">Costo de envío</span>
                                <span class="text-text tabular-nums">{{ formatCurrency(quote.shipping_cost) }}</span>
                            </div>
                            <div class="flex items-center justify-between text-sm font-medium">
                                <span class="text-text">Total</span>
                                <span class="text-text tabular-nums">{{ formatCurrency(quote.total) }}</span>
                            </div>
                            <div v-if="Number(quote.down_payment) > 0" class="flex items-center justify-between text-sm">
                                <span class="text-text-muted">Anticipo</span>
                                <span class="text-text tabular-nums">-{{ formatCurrency(quote.down_payment) }}</span>
                            </div>
                            <!-- Puede ser negativo a propósito (anticipo mayor al total): con su signo. -->
                            <div class="flex items-center justify-between text-sm font-medium pt-1.5 border-t border-border">
                                <span class="text-text">Saldo</span>
                                <span class="text-text tabular-nums">{{ formatCurrency(quote.balance) }}</span>
                            </div>
                            <div class="flex items-center justify-between gap-3 text-sm">
                                <span class="text-text-muted">Forma de pago</span>
                                <span class="text-text text-right">{{ paymentTermsLabel(quote.payment_terms) }}</span>
                            </div>
                            <div
                                v-if="quote.payment_terms === 'credit' && quote.credit_due_date"
                                class="flex items-center justify-between gap-3 text-sm"
                            >
                                <span class="text-text-muted">Vence</span>
                                <span class="text-text text-right whitespace-nowrap">{{ formatDateOnly(quote.credit_due_date) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <ConfirmDialog :pt="{ mask: { class: 'bg-primary/50' } }">
            <template #container="{ message, acceptCallback, rejectCallback }">
                <div class="bg-surface border border-border rounded-md p-5 w-95 max-w-[90vw]">
                    <h3 class="font-serif text-base text-primary mb-2">{{ message.header }}</h3>
                    <p class="text-sm text-text-muted mb-5">{{ message.message }}</p>
                    <!-- Un solo diálogo para cancelar y marcar como pagado: el botón
					     de confirmar sale de `acceptLabel` y `tone` (danger|primary).
					     Ambas acciones son irreversibles, así que el foco cae en Volver. -->
                    <div class="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            autofocus
                            @click="rejectCallback"
                            class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                        >
                            Volver
                        </button>
                        <button
                            type="button"
                            @click="acceptCallback"
                            class="text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                            :class="message.tone === 'primary' ? 'bg-primary hover:bg-primary-dark' : 'bg-danger hover:bg-danger/90'"
                        >
                            {{ message.acceptLabel }}
                        </button>
                    </div>
                </div>
            </template>
        </ConfirmDialog>
    </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import { useQuotesStore } from "@/stores/quotes";
import { useInventoryStore } from "@/stores/inventory";
import { useSimpleProductsStore } from "@/stores/simpleProducts";
import { simpleProductStockAfterSale, variantStockAfterSale } from "@/lib/saleForm";
import DocumentItemsTable from "@/components/widgets/tables/DocumentItemsTable.vue";
import { statusClasses, statusLabel } from "@/lib/quoteStatus";
import QuotePaidBadge from "@/views/quotes/components/QuotePaidBadge.vue";
import { useDocumentPdf } from "@/composables/useDocumentPdf";
import { useNotify } from "@/composables/useNotify";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatDateOnly, formatDateTime } from "@/lib/dates";
import { paymentTermsLabel } from "@/lib/quotePayment";

const route = useRoute();
const router = useRouter();
const quotes = useQuotesStore();
const inventory = useInventoryStore();
const simpleProducts = useSimpleProductsStore();
const confirm = useConfirm();
const notify = useNotify();

const cancelling = ref(false);
const cancelError = ref(null);
const markingPaid = ref(false);
const markPaidError = ref(null);

// Evita mostrar por un instante una cotización distinta si el store aún
// trae la de una visita anterior.
const quote = computed(() => {
    const current = quotes.currentQuote;
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
    fetchPdf: quotes.fetchQuotePdf,
    filePrefix: "Presupuesto",
    titlePrefix: "Presupuesto",
    id: () => route.params.id,
    document: quote,
});

watch(
    () => route.params.id,
    (id) => {
        resetPdf();
        cancelError.value = null;
        markPaidError.value = null;
        if (id) quotes.fetchQuote(id);
    },
    { immediate: true },
);

// Pagada sigue en Borrador, pero el backend ya bloquea editar, cancelar y
// convertir a venta (y volver a marcarla): mismo guard aquí, solo como UX.
const isEditable = computed(() => quote.value?.status === "Borrador" && !quote.value.paid_at);

// Líneas cobradas a precio de mayoreo (solo productos simples lo tienen).
const wholesaleCount = computed(
    () => (quote.value?.items ?? []).filter((item) => item.price_type === "wholesale").length,
);

// `comprobante` solo viene en GET /quotes/{id} (null si no se ha convertido).
const canConvertToComprobante = computed(() => !!quote.value?.paid_at && !quote.value.comprobante);

function convertToComprobante() {
    router.push({ name: "comprobantes.create", query: { quote_id: quote.value.id } });
}

function editQuote() {
    router.push({ name: "quotes.edit", params: { id: quote.value.id } });
}

function convertToSale() {
    router.push({ name: "pos.sales.create", query: { quote_id: quote.value.id } });
}

function requestCancel() {
    confirm.require({
        header: "Cancelar presupuesto",
        message: `¿Cancelar el presupuesto ${quote.value.folio}? Ya no se podrá editar ni convertir a venta. Esta acción no se puede deshacer.`,
        acceptLabel: "Cancelar presupuesto",
        tone: "danger",
        accept: cancelQuote,
    });
}

function requestMarkPaid() {
    confirm.require({
        header: "Marcar como pagado",
        message: `¿Confirmar el pago de ${quote.value.folio}? Se descontará del inventario el stock de sus productos y ya no se podrá editar, cancelar ni convertir a venta. Esta acción no se puede deshacer.`,
        acceptLabel: "Marcar como pagado",
        tone: "primary",
        accept: markPaid,
    });
}

async function markPaid() {
    markingPaid.value = true;
    markPaidError.value = null;

    try {
        const paid = await quotes.markQuotePaid(quote.value.id);
        syncStock(paid.items ?? []);
        notify.success("Presupuesto marcado como pagado", paid.folio);
    } catch (err) {
        console.error(err);
        // 422 de negocio (ya pagada, producto dado de baja, variante sin cajas,
        // stock insuficiente): sin campo al cual asociarlo, va como error general.
        markPaidError.value =
            err.response?.status === 422
                ? err.response.data.message
                : "No se pudo marcar como pagado. Intenta de nuevo.";
    } finally {
        markingPaid.value = false;
    }
}

// El backend descontó stock: se refleja en los stores cacheados (si ya se
// cargaron) con el mismo cálculo que usa POS al registrar una venta, para que
// Inventario y los avisos de stock no muestren el stock anterior. `quantity`
// llega como string decimal; el helper de simples la suma como número.
function syncStock(items) {
    const stockItems = items.map((item) => ({
        product_variant_id: item.product_variant_id,
        boxes: item.boxes,
        simple_product_id: item.simple_product_id,
        quantity: Number(item.quantity),
    }));

    if (inventory.initialized) {
        for (const { variantId, ...stock } of variantStockAfterSale(stockItems, inventory.products)) {
            inventory.updateVariantStock(variantId, stock);
        }
    }
    if (simpleProducts.initialized) {
        for (const { productId, ...stock } of simpleProductStockAfterSale(stockItems, simpleProducts.simpleProducts)) {
            simpleProducts.updateSimpleProductStock(productId, stock);
        }
    }
}

async function cancelQuote() {
    cancelling.value = true;
    cancelError.value = null;

    try {
        const cancelled = await quotes.cancelQuote(quote.value.id);
        notify.success(`Presupuesto ${cancelled.folio} cancelado`);
    } catch (err) {
        console.error(err);
        cancelError.value =
            err.response?.status === 422
                ? err.response.data.message
                : "No se pudo cancelar el presupuesto. Intenta de nuevo.";
    } finally {
        cancelling.value = false;
    }
}

function goBack() {
    router.push({ name: "quotes", query: quotes.listQuery });
}
</script>

<style scoped></style>
