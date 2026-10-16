<template>
    <!-- Tabla compacta (mismo patrón que los colores en ProductFormView):
         encabezado una vez y una fila delgada por producto. Por debajo de sm
         cada fila apila sus campos con su label visible; desde sm los labels
         pasan a sr-only y el encabezado toma su lugar. Header y filas comparten
         el mismo grid + hueco del botón para alinear. `relative`: los labels
         sr-only son absolute y sin ancestro posicionado escapan del scroll. -->
    <div class="relative border border-border rounded-md">
        <div
            class="hidden sm:flex items-center gap-2 bg-bg border-b border-border rounded-t-md px-3 py-2"
            aria-hidden="true"
        >
            <div
                class="flex-1 grid grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))] gap-3 text-xs font-medium uppercase tracking-wide text-text-muted"
            >
                <span>Producto<span class="text-danger ml-0.5">*</span></span>
                <span>m² requeridos</span>
                <span>Cantidad<span class="text-danger ml-0.5">*</span></span>
                <!-- normal-case: el uppercase del encabezado convertiría m² en M² -->
                <span
                >Precio unitario<span class="normal-case">/m²</span
                ><span v-if="priceRequired" class="text-danger ml-0.5">*</span></span
                >
                <span class="text-right">Subtotal</span>
            </div>
            <span class="w-8 shrink-0"></span>
        </div>

        <div class="divide-y divide-border">
            <div v-for="(row, index) in lines" :key="row.id" class="px-3 py-3 sm:py-2">
                <div class="flex items-start gap-2">
                    <!-- Sin producto elegido: el buscador ocupa toda la fila -->
                    <div v-if="!hasProduct(row)" class="flex-1 min-w-0 space-y-1.5 sm:space-y-0">
                        <label
                            :for="`product-${row.id}`"
                            class="text-xs font-medium text-text-muted block sm:sr-only"
                        >
                            Producto {{ index + 1 }}
                        </label>
                        <ProductAutocomplete
                            :input-id="`product-${row.id}`"
                            include-simple-products
                            @select="(option) => selectProductForRow(row, option)"
                        />
                    </div>

                    <div
                        v-else
                        class="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))] gap-3"
                    >
                        <!-- Producto: nombre + detalle en dos renglones, "Cambiar" en línea -->
                        <div class="min-w-0 sm:min-h-10 flex flex-col justify-center">
                            <template v-if="row.simpleProduct">
                                <p
                                    class="text-sm font-medium text-text truncate"
                                    :title="simpleProductFor(row).name"
                                >
                                    {{ simpleProductFor(row).name }}
                                </p>
                                <p class="text-xs text-text-muted flex items-center gap-2">
                                    <span
                                        v-if="simpleProductCategoryName(row)"
                                        class="border border-border rounded px-1.5"
                                    >
                                        {{ simpleProductCategoryName(row) }}
                                    </span>
                                    <button
                                        type="button"
                                        @click="changeLine(row)"
                                        class="text-accent hover:underline cursor-pointer"
                                    >
                                        Cambiar
                                    </button>
                                </p>
                            </template>
                            <template v-else>
                                <p
                                    class="text-sm font-medium text-text truncate"
                                    :title="row.variant.lineName"
                                >
                                    {{ row.variant.lineName }}
                                </p>
                                <p class="text-xs text-text-muted flex items-center gap-2 min-w-0">
                                    <span class="truncate"
                                    >{{ row.variant.color }} · {{ row.variant.size }}</span
                                    >
                                    <button
                                        type="button"
                                        @click="changeLine(row)"
                                        class="text-accent hover:underline shrink-0 cursor-pointer"
                                    >
                                        Cambiar
                                    </button>
                                </p>
                            </template>
                            <p v-if="mergedRowId === row.id" class="text-xs text-success mt-0.5">
                                Cantidad fusionada con esta línea existente.
                            </p>
                            <p v-if="boxConversionError(row)" class="text-danger text-xs mt-0.5">
                                {{ boxConversionError(row) }}
                            </p>
                        </div>

                        <!-- m² que pide el cliente (opcional, solo variantes por caja): sugieren
                             las cajas con ceil. No se envían al backend: la cantidad real son las
                             cajas, que se pueden ajustar después (ej. una de más por merma). Las
                             variantes por pieza no tienen m²: se captura la cantidad directa. -->
                        <div v-if="row.variant && !isPieceLine(row)" class="space-y-1.5 sm:space-y-0">
                            <FieldLabel
                                :html-for="`requested-${row.id}`"
                                text="m² requeridos"
                                class="sm:sr-only"
                            />
                            <InputNumberCustom
                                :id="`requested-${row.id}`"
                                :model-value="row.requestedM2"
                                :min="0"
                                placeholder="Opcional"
                                suffix=" m²"
                                :max-fraction-digits="2"
                                :disabled="!row.variant.m2_per_box"
                                @update:model-value="(value) => applyRequestedM2(row, value)"
                            />
                        </div>
                        <div v-else class="hidden sm:block" aria-hidden="true"></div>

                        <!-- Cantidad en la unidad física de stock: cajas completas (variante) o
                             unidades (simple). En variantes, debajo los m² que cubren esas cajas. -->
                        <div class="space-y-1.5 sm:space-y-0">
                            <FieldLabel
                                :html-for="`quantity-${row.id}`"
                                :text="
                                    row.variant
                                        ? isPieceLine(row)
                                            ? 'Piezas'
                                            : 'Cajas'
                                        : 'Cantidad (unidades)'
                                "
                                required
                                class="sm:sr-only"
                            />
                            <InputNumberCustom
                                v-if="row.variant"
                                :id="`quantity-${row.id}`"
                                v-model="row.quantity"
                                :min="1"
                                :placeholder="`0 ${lineUnit(row)}`"
                                :suffix="` ${lineUnit(row)}`"
                                :max-fraction-digits="0"
                                :error="quantityError(row)"
                            />
                            <InputNumberCustom
                                v-else
                                :id="`quantity-${row.id}`"
                                v-model="row.quantity"
                                :min="1"
                                placeholder="0 uds."
                                suffix=" uds."
                                :max-fraction-digits="0"
                                :error="quantityError(row)"
                            />
                            <p v-if="quantityError(row)" class="text-danger text-xs mt-1.5">
                                {{ quantityError(row) }}
                            </p>
                            <p
                                v-else-if="row.variant && coveredM2(row) !== null"
                                class="text-xs mt-1 tabular-nums"
                                :class="coversRequested(row) ? 'text-text-muted' : 'text-amber-700'"
                            >
                                {{ formatQuantity(coveredM2(row)) }} m²<template
                                    v-if="!coversRequested(row)"
                                >
                                    · no cubre {{ formatQuantity(row.requestedM2) }}</template
                                >
                            </p>
                        </div>

                        <!-- Precio: capturable en venta, informativo en cotización -->
                        <slot name="price" :row="row"></slot>

                        <div class="space-y-1.5 sm:space-y-0">
                            <span class="text-xs font-medium text-text-muted block sm:sr-only"
                            >Subtotal</span
                            >
                            <p
                                class="sm:h-10 flex items-center sm:justify-end text-sm font-medium text-text tabular-nums"
                            >
                                {{ formatCurrency(lineSubtotal(row)) }}
                            </p>
                        </div>
                    </div>

                    <!-- Mismo alto que los inputs para quedar centrado con ellos desde sm -->
                    <button
                        type="button"
                        @click="removeLine(row.id)"
                        :disabled="lines.length === 1"
                        class="w-8 h-10 shrink-0 flex items-center justify-center rounded text-text-muted hover:text-danger disabled:opacity-30 disabled:hover:text-text-muted disabled:cursor-not-allowed transition-colors cursor-pointer"
                        aria-label="Quitar producto"
                        title="Quitar producto"
                    >
                        <svg
                            class="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M6 18L18 6" />
                        </svg>
                    </button>
                </div>

                <!-- Aviso de stock: en cotización es un aviso, en venta un error -->
                <slot name="stock-alert" :row="row"></slot>
            </div>
        </div>
    </div>

    <button
        type="button"
        @click="addLine"
        class="mt-3 w-full border border-dashed border-border rounded-md py-2 text-sm text-text-muted hover:text-text hover:border-accent transition-colors select-none cursor-pointer"
    >
        + Agregar producto
    </button>
</template>

<script setup>
import { nextTick, ref } from "vue";
import ProductAutocomplete from "@/components/widgets/autocompletes/ProductAutocomplete.vue";
import InputNumberCustom from "@/components/widgets/InputNumberCustom.vue";
import FieldLabel from "@/components/widgets/labels/FieldLabel.vue";
import { useLineProducts } from "@/composables/useLineProducts";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatQuantity } from "@/lib/formatQuantity";
import * as documentLines from "@/lib/documentLines";
import { applyRequestedM2, createEmptyLine, findLineForProduct, hasProduct } from "@/lib/documentLines";

// Lista repetible de productos de un documento (QuoteFormView, SaleFormView):
// buscador, fusión de productos repetidos, m² requeridos, cantidad y subtotal
// por línea. Lo que cambia entre documentos llega de la vista: la celda de
// precio (slot `price`), el aviso de stock (slot `stock-alert`) y el subtotal
// (`lineSubtotal`, porque en venta el precio se captura y en cotización es el
// de lista). Las líneas se editan sobre el mismo array (`v-model:lines`).

const lines = defineModel("lines", { type: Array, required: true });

const props = defineProps({
    // Los errores por línea solo se muestran después del primer intento de guardar.
    submitAttempted: { type: Boolean, default: false },
    // Completa el aviso de variante sin m² por caja: "cotizar", "vender".
    action: { type: String, required: true },
    priceRequired: { type: Boolean, default: false },
    lineSubtotal: { type: Function, required: true },
    // Campos propios de cada documento en una línea nueva (ej. `unit_price` en venta).
    emptyLineFields: { type: Object, default: () => ({}) },
});

// `select`: la línea recibió un producto nuevo (no una fusión), ej. para
// precargar su precio de lista en venta.
const emit = defineEmits(["select"]);

const { isPieceLine, simpleProductFor, simpleProductCategoryName } = useLineProducts();

function newLine() {
    return createEmptyLine(props.emptyLineFields);
}

const mergedRowId = ref(null);
let mergeTimeoutHandle = null;

function flashMerge(id) {
    mergedRowId.value = id;
    clearTimeout(mergeTimeoutHandle);
    mergeTimeoutHandle = setTimeout(() => {
        mergedRowId.value = null;
    }, 2500);
}

function addLine() {
    lines.value.push(newLine());
}

function removeLine(id) {
    if (lines.value.length === 1) return;
    lines.value = lines.value.filter((l) => l.id !== id);
}

function changeLine(row) {
    row.variant = null;
    row.simpleProduct = null;
}

// Sin mouse: tras elegir un producto el foco pasa a su cantidad. En una variante
// nueva va a "m² requeridos" (el cliente suele pedir en m² y de ahí salen las
// cajas); en una fusión, a las cajas/unidades que acaban de sumar uno.
async function focusLineQuantity(row, { merged = false } = {}) {
    await nextTick();
    const field =
        !merged && row.variant && Number(row.variant.m2_per_box) > 0 ? "requested" : "quantity";
    const input = document.getElementById(`${field}-${row.id}`);
    input?.focus();
    input?.select();
}

// Si el producto (variante o simple) ya existe en otra línea del form, se suma
// la cantidad nueva a esa línea existente (conservando lo demás que ya tenga,
// ej. el precio capturado en venta) en vez de duplicar la fila (ver AGENT.md —
// listas repetibles no deben permitir estado duplicado inconsistente).
function selectProductForRow(row, option) {
    const isSimple = option.type === "simple";
    const target = findLineForProduct(lines.value, option);

    if (target) {
        target.quantity = (Number(target.quantity) || 0) + 1;
        flashMerge(target.id);
        lines.value = lines.value.filter((l) => l.id !== row.id);
        if (lines.value.length === 0) lines.value.push(newLine());
        focusLineQuantity(target, { merged: true });
        return;
    }

    row.variant = isSimple ? null : option;
    row.simpleProduct = isSimple ? option : null;

    // Cajas y unidades son enteras: al "Cambiar" se conserva la cantidad. Los m²
    // requeridos solo aplican a variantes; con otra variante (otro m² por caja)
    // se recalculan las cajas.
    row.quantity = row.quantity > 0 ? row.quantity : 1;
    if (isSimple || isPieceLine(row)) row.requestedM2 = null;
    else if (row.requestedM2 > 0) applyRequestedM2(row, row.requestedM2);

    emit("select", row);

    focusLineQuantity(row);
}

function lineUnit(row) {
    return documentLines.lineUnit(isPieceLine(row));
}

function coveredM2(row) {
    return documentLines.coveredM2(row, isPieceLine(row));
}

function coversRequested(row) {
    return documentLines.coversRequested(row, isPieceLine(row));
}

function boxConversionError(row) {
    return documentLines.boxConversionError(row, isPieceLine(row), props.action);
}

function quantityError(row) {
    if (!props.submitAttempted) return "";
    return documentLines.missingQuantityMessage(row, isPieceLine(row));
}
</script>

<style scoped></style>
