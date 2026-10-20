<template>
    <div class="p-2 max-w-4xl">
        <div class="mb-4">
            <h1 class="font-serif text-xl text-primary">{{ route.meta.title }}</h1>
            <p class="text-sm text-text-muted mt-0.5">
                Selecciona los productos y captura las cantidades de la cotización.
            </p>
        </div>

        <div v-if="loadingQuote" class="text-text-muted text-sm">Cargando cotización…</div>

        <p
            v-if="loadError"
            class="text-danger text-sm mb-4 flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2"
        >
            <svg
                class="w-3.5 h-3.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
            </svg>
            {{ loadError }}
        </p>

        <form v-if="!loadingQuote && !loadError" @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Sección 1 — Datos generales -->
            <div class="bg-surface border border-border rounded-md p-5 sm:p-6">
                <h2 class="text-xs font-medium uppercase tracking-wide text-text-muted mb-4">
                    Datos generales
                </h2>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                        <FieldLabel html-for="customer_id" text="Cliente" />
                        <CustomerSearch id="customer_id" v-model="form.customer_id" />
                    </div>

                    <div class="space-y-1.5 sm:col-span-2">
                        <FieldLabel html-for="notes" text="Notas" />
                        <TextareaCustom
                            id="notes"
                            v-model="form.notes"
                            rows="3"
                            placeholder="Notas adicionales para esta cotización (opcional)"
                        />
                    </div>
                </div>
            </div>

            <!-- Sección 2 — Líneas de producto -->
            <div class="bg-surface border border-border rounded-md p-5 sm:p-6">
                <h2 class="text-xs font-medium uppercase tracking-wide text-text-muted mb-4">
                    Productos
                </h2>

                <DocumentLinesTable
                    v-model:lines="lines"
                    :submit-attempted="submitAttempted"
                    action="cotizar"
                    :line-subtotal="lineSubtotal"
                >
                    <template #price="{ row }">
                        <QuoteLinePrice :row="row" />
                    </template>

                    <template #stock-alert="{ row }">
                        <p
                            v-if="hasProduct(row) && hasInsufficientStock(row)"
                            class="mt-2 sm:mr-10 flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2"
                        >
                            <i class="ti ti-alert-triangle text-sm leading-none" aria-hidden="true"></i>
                            <span>{{ stockWarning(row) }}</span>
                        </p>
                    </template>
                </DocumentLinesTable>
            </div>

            <!-- Sección 3 — Pago y totales -->
            <QuotePaymentSection
                v-model:form="form"
                v-model:errors="errors"
                :subtotal="subtotal"
                :totals="totals"
            />

            <!-- Junto a las acciones (no arriba del form): con varias líneas, el inicio
			     del form queda fuera de vista al presionar Guardar. -->
            <p
                v-if="generalError"
                role="alert"
                class="text-danger text-sm flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2"
            >
                <svg
                    class="w-3.5 h-3.5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
                {{ generalError }}
            </p>

            <!-- Acciones -->
            <div class="flex items-center justify-end gap-3">
                <button
                    type="button"
                    @click="handleCancel"
                    class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    :disabled="submitting"
                    class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                >
                    {{ submitting ? "Guardando…" : "Guardar cotización" }}
                </button>
            </div>
        </form>

        <ConfirmDialog :pt="{ mask: { class: 'bg-primary/50' } }">
            <template #container="{ message, acceptCallback, rejectCallback }">
                <div class="bg-surface border border-border rounded-md p-5 w-[380px] max-w-[90vw]">
                    <h3 class="font-serif text-base text-primary mb-2">{{ message.header }}</h3>
                    <p class="text-sm text-text-muted mb-5">{{ message.message }}</p>
                    <div class="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            @click="rejectCallback"
                            class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                        >
                            Seguir editando
                        </button>
                        <button
                            type="button"
                            @click="acceptCallback"
                            class="bg-danger hover:bg-danger/90 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                        >
                            Descartar cambios
                        </button>
                    </div>
                </div>
            </template>
        </ConfirmDialog>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import { useInventoryStore } from "@/stores/inventory";
import { useSimpleProductsStore } from "@/stores/simpleProducts";
import { useCatalogsStore } from "@/stores/catalogs";
import { useQuotesStore } from "@/stores/quotes";
import CustomerSearch from "@/components/widgets/autocompletes/CustomerSearch.vue";
import DocumentLinesTable from "@/components/widgets/tables/DocumentLinesTable.vue";
import TextareaCustom from "@/components/widgets/TextareaCustom.vue";
import FieldLabel from "@/components/widgets/labels/FieldLabel.vue";
import QuoteLinePrice from "@/views/quotes/components/QuoteLinePrice.vue";
import QuotePaymentSection from "@/views/quotes/components/QuotePaymentSection.vue";
import { discountExceedsSubtotal, paymentPayload, quoteTotals } from "@/lib/quotePayment";
import { quoteItemToLine } from "@/lib/quoteForm";
import * as documentLines from "@/lib/documentLines";
import { createEmptyLine, hasProduct, lineItemPayload, serializeLines } from "@/lib/documentLines";
import { useNotify } from "@/composables/useNotify";
import { useLineProducts } from "@/composables/useLineProducts";

const route = useRoute();
const router = useRouter();
const inventory = useInventoryStore();
const simpleProducts = useSimpleProductsStore();
const catalogs = useCatalogsStore();
const quotes = useQuotesStore();
const notify = useNotify();
const confirm = useConfirm();
const { isPieceLine, simpleProductFor, linePriceType } = useLineProducts();

// Modo edición cuando la ruta trae :id (quotes.edit); sin :id es creación.
const quoteId = computed(() => route.params.id ?? null);
const isEdit = computed(() => quoteId.value !== null);
const loadingQuote = ref(false);

onMounted(() => {
    // Las líneas existentes ya traen su variante en la respuesta del quote, pero
    // el buscador de "Cambiar" / "+ Agregar producto" sigue dependiendo del
    // inventario, así que se carga en ambos modos (cacheado vía `initialized`).
    // ProductAutocomplete también lo carga al montarse; el guard de `loading`
    // evita el request duplicado.
    if (!inventory.initialized && !inventory.loading) inventory.fetchProducts();
    // Mismo criterio para productos simples: precio y stock "en vivo" de las
    // líneas simples (y su categoría, vía catálogos) salen de estos stores, no de
    // la respuesta del quote, que solo trae id/name/price.
    if (!simpleProducts.initialized && !simpleProducts.loading)
        simpleProducts.fetchSimpleProducts();
    if (!catalogs.initialized && !catalogs.loading) catalogs.fetchCatalogs();
    if (isEdit.value) loadQuote();
});

async function loadQuote() {
    loadingQuote.value = true;
    await quotes.fetchQuote(quoteId.value);
    loadingQuote.value = false;

    const quote = quotes.currentQuote;
    if (quotes.currentQuoteError || !quote || String(quote.id) !== String(quoteId.value)) {
        loadError.value = quotes.currentQuoteError || "No se pudo cargar la cotización.";
        return;
    }

    // El backend rechaza el PUT si no está en Borrador (guard real); esto solo
    // evita mostrar un form editable que de todos modos va a fallar.
    if (quote.status !== "Borrador") {
        router.replace({ name: "quotes.show", params: { id: quote.id } });
        return;
    }

    form.customer_id = quote.customer_id ?? "";
    form.notes = quote.notes ?? "";
    // Los montos llegan como string decimal ("150.00"); InputNumberCustom los acepta así.
    form.discount = quote.discount;
    form.shipping_cost = quote.shipping_cost;
    form.down_payment = quote.down_payment;
    form.payment_terms = quote.payment_terms ?? "cash";
    form.credit_due_date = quote.credit_due_date ?? "";

    const loadedLines = (quote.items ?? []).map(quoteItemToLine);
    lines.value = loadedLines.length > 0 ? loadedLines : [createEmptyLine()];
    savedSnapshot.value = serializeForm();
}

const form = reactive({
    customer_id: "",
    notes: "",
    // Montos opcionales: null = no aplica (el backend los trata como 0).
    discount: null,
    shipping_cost: null,
    down_payment: null,
    payment_terms: "cash",
    // String "YYYY-MM-DD" del input date; "" = sin fecha.
    credit_due_date: "",
});

// Errores de los campos de pago (validación local de la fecha y 422 del backend).
const errors = reactive({
    discount: "",
    shipping_cost: "",
    down_payment: "",
    payment_terms: "",
    credit_due_date: "",
});

// De contado no hay vencimiento: se limpia aquí para no enviarlo (el backend
// también lo limpia, pero no se depende solo de eso).
watch(
    () => form.payment_terms,
    (terms) => {
        if (terms === "cash") {
            form.credit_due_date = "";
            errors.credit_due_date = "";
        }
    },
);

const lines = ref([createEmptyLine()]);

// Cambios sin guardar: se compara contra una foto del form tomada al iniciar
// (creación) o al terminar de cargar la cotización (edición). Solo cuenta lo
// que se envía al backend; una línea vacía agregada y sin usar no es un cambio.
function serializeForm() {
    return JSON.stringify({
        customer_id: form.customer_id || null,
        notes: form.notes || null,
        ...paymentPayload(form),
        lines: serializeLines(lines.value),
    });
}

const savedSnapshot = ref(serializeForm());
const isDirty = computed(() => serializeForm() !== savedSnapshot.value);
// Tras guardar se navega fuera del form sin pasar por la confirmación.
let skipLeaveGuard = false;

onBeforeRouteLeave(() => {
    if (skipLeaveGuard || !isDirty.value) return true;

    return new Promise((resolve) => {
        confirm.require({
            header: "Descartar cambios",
            message: "Hay cambios sin guardar en esta cotización. Si sales ahora, se perderán.",
            accept: () => resolve(true),
            reject: () => resolve(false),
            onHide: () => resolve(false),
        });
    });
});

// Cerrar/recargar la pestaña no pasa por el router: el navegador muestra su
// propio aviso genérico (no se puede personalizar el texto).
function handleBeforeUnload(event) {
    if (!isDirty.value) return;
    event.preventDefault();
    event.returnValue = "";
}

window.addEventListener("beforeunload", handleBeforeUnload);
onBeforeUnmount(() => window.removeEventListener("beforeunload", handleBeforeUnload));

// Las reglas de cada línea viven en lib/documentLines.js; aquí solo se les pasa
// lo que depende de los stores (si es por pieza, el producto simple "en vivo").
function lineStock(row) {
    return documentLines.toStock(row.simpleProduct ? simpleProductFor(row).stock_quantity : row.variant.stock_boxes);
}

function hasInsufficientStock(row) {
    return documentLines.exceedsStock(row, lineStock(row));
}

// Es un aviso, no un error: la cotización se puede guardar igual (el stock se
// valida hasta convertirla en venta).
function stockWarning(row) {
    return documentLines.stockShortageMessage(row, lineStock(row), isPieceLine(row), {
        verb: "cotizan",
        consequence: "Consultar disponibilidad sobre pedido.",
    });
}

function lineSubtotal(row) {
    if (!hasProduct(row)) return 0;
    const isPiece = isPieceLine(row);
    const simpleProduct = row.simpleProduct ? simpleProductFor(row) : null;
    return documentLines.lineSubtotal(row, isPiece, documentLines.listPrice(row, isPiece, simpleProduct));
}

const subtotal = computed(() => lines.value.reduce((sum, row) => sum + lineSubtotal(row), 0));
// Sin impuestos por ahora, igual que el backend.
const totals = computed(() =>
    quoteTotals({
        subtotal: subtotal.value,
        discount: form.discount,
        shippingCost: form.shipping_cost,
        downPayment: form.down_payment,
    }),
);

const submitting = ref(false);
const generalError = ref(null);
// Fallo de fetchQuote en modo edición: oculta el form (no se debe poder
// enviar uno vacío sobre una cotización que no cargó). generalError queda
// solo para errores de submit, que no desmontan el form.
const loadError = ref(null);

// Se activa en el primer intento de guardar; desde ahí el error de cantidad de
// cada línea se evalúa en vivo y desaparece en cuanto se captura un valor válido.
const submitAttempted = ref(false);

// La tabla muestra estos mismos errores por línea; aquí deciden si se puede guardar.
function quantityError(row) {
    return documentLines.missingQuantityMessage(row, isPieceLine(row));
}

function boxConversionError(row) {
    return documentLines.boxConversionError(row, isPieceLine(row), "cotizar");
}

const handleSubmit = async () => {
    generalError.value = null;
    // Un 422 anterior (ej. descuento) pudo dejar de aplicar al cambiar las líneas.
    for (const field of Object.keys(errors)) errors[field] = "";
    submitAttempted.value = true;

    // Una línea con producto pero sin cantidad bloquea el guardado (antes se
    // descartaba en silencio). Las líneas sin producto sí se ignoran: son filas
    // agregadas con "+ Agregar producto" que no se llegaron a usar.
    if (lines.value.some((l) => quantityError(l))) {
        generalError.value = "Hay productos sin cantidad. Captúrala o quita la línea.";
        return;
    }

    if (lines.value.some((l) => boxConversionError(l))) {
        generalError.value =
            "Hay variantes sin m² por caja configurado. Quítalas o corrígelas en Inventario.";
        return;
    }

    const validLines = lines.value.filter(hasProduct);
    if (validLines.length === 0) {
        generalError.value = "Agrega al menos un producto con cantidad mayor a cero.";
        return;
    }

    // Con crédito el backend exige el vencimiento (required_if).
    if (form.payment_terms === "credit" && !form.credit_due_date) {
        errors.credit_due_date = "Este campo es requerido";
        document.getElementById("credit_due_date")?.focus();
        return;
    }

    submitting.value = true;

    try {
        const payload = {
            customer_id: form.customer_id || null,
            notes: form.notes || null,
            ...paymentPayload(form),
            items: validLines.map((l) => lineItemPayload(l, linePriceType(l))),
        };

        if (isEdit.value) {
            const updated = await quotes.updateQuote(quoteId.value, payload);
            skipLeaveGuard = true;
            notify.success(`Cotización ${updated.folio} actualizada`);
            router.push({ name: "quotes.show", params: { id: quoteId.value } });
        } else {
            // Al detalle, no al listado: lo siguiente suele ser descargar o compartir el PDF.
            const created = await quotes.createQuote(payload);
            skipLeaveGuard = true;
            notify.success(`Cotización ${created.folio} guardada`);
            router.push({ name: "quotes.show", params: { id: created.id } });
        }
    } catch (err) {
        if (err.response?.status === 422 && applyServerErrors(err.response.data)) return;

        console.error(err);
        generalError.value =
            err.response?.data?.message || "No se pudo guardar la cotización. Intenta de nuevo.";
    } finally {
        submitting.value = false;
    }
};

// Lleva al campo los errores 422 que corresponden a uno de pago. Devuelve true
// si todos quedaron bajo su campo; si no, el `message` va al error general
// (ej. errores de líneas, que no tienen campo propio aquí).
function applyServerErrors(data) {
    const serverErrors = data.errors ?? {};
    const fields = Object.keys(serverErrors);

    // El descuento mayor que el subtotal es un 422 de negocio sin `errors`
    // (guard del controlador): con el mismo cálculo local se sabe que es suyo.
    if (fields.length === 0) {
        if (!discountExceedsSubtotal(subtotal.value, form.discount)) return false;
        errors.discount = data.message;
        document.getElementById("discount")?.focus();
        return true;
    }

    for (const field of fields) {
        if (field in errors) errors[field] = serverErrors[field][0];
    }

    const firstField = fields.find((field) => field in errors);
    if (firstField) document.getElementById(firstField)?.focus();

    return fields.every((field) => field in errors);
}

function handleCancel() {
    if (isEdit.value) router.push({ name: "quotes.show", params: { id: quoteId.value } });
    else router.push({ name: "quotes" });
}
</script>

<style scoped></style>
