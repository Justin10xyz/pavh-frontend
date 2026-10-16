<template>
    <div class="mt-6">
        <h3 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-3">
            Colores
        </h3>

        <!-- Tabla compacta: encabezado una vez y una fila delgada por color. Por
		     debajo de sm cada fila apila sus 3 campos con su label visible; desde
		     sm los labels pasan a sr-only (siguen asociados al input) y el
		     encabezado de columnas toma su lugar. Header y filas comparten la
		     misma estructura (grid de 3 columnas + hueco del botón) para alinear. -->
        <!-- `relative`: los labels `sm:sr-only` son `position: absolute`; sin un
		     ancestro posicionado se ubican contra el documento, escapan del scroll
		     de <main> (AppLayout) y alargan el <body>, descuadrando el layout. -->
        <div class="relative border border-border rounded-md overflow-hidden">
            <div
                class="hidden sm:flex items-center gap-2 bg-bg border-b border-border px-3 py-2"
                aria-hidden="true"
            >
                <div
                    class="flex-1 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 text-xs font-medium uppercase tracking-wide text-text-muted"
                >
                    <span>Color<span class="text-danger ml-0.5">*</span></span>
                    <span>Stock ({{ stockUnit.label }})</span>
                    <span>Stock mínimo</span>
                </div>
                <span class="w-8 shrink-0"></span>
            </div>

            <div class="divide-y divide-border">
                <div
                    v-for="row in rows"
                    :key="row.id"
                    class="flex items-start gap-2 px-3 py-3 sm:py-2"
                >
                    <div
                        class="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3"
                    >
                        <div class="space-y-1.5 sm:space-y-0">
                            <FieldLabel
                                :html-for="`color-${row.id}`"
                                text="Color"
                                required
                                class="sm:sr-only"
                            />
                            <InputTextCustom
                                :id="`color-${row.id}`"
                                v-model="row.color"
                                :error="row.errors.color"
                                placeholder="Ej. Blanco"
                                @input="row.errors.color = ''"
                            />
                            <p v-if="row.errors.color" class="text-danger text-xs mt-1.5">
                                {{ row.errors.color }}
                            </p>
                        </div>

                        <!-- Mismo campo para colores nuevos (stock inicial) y existentes:
						     en uno existente el cambio se aplica al guardar como ajuste
						     con historial (ver applyStockChanges en la vista). Vacío = sin control. -->
                        <div class="space-y-1.5 sm:space-y-0">
                            <FieldLabel
                                :html-for="`stock_boxes-${row.id}`"
                                :text="`${row.variantId ? 'Stock actual' : 'Stock inicial'} (${stockUnit.label})`"
                                class="sm:sr-only"
                            />
                            <InputNumberCustom
                                :id="`stock_boxes-${row.id}`"
                                v-model="row.stock_boxes"
                                :error="row.errors.stock_boxes"
                                :min="0"
                                placeholder="Sin control"
                                @input="row.errors.stock_boxes = ''"
                                :max-fraction-digits="0"
                            />
                            <p v-if="row.errors.stock_boxes" class="text-danger text-xs mt-1.5">
                                {{ row.errors.stock_boxes }}
                            </p>
                            <p
                                v-else-if="row.variantId && stockChangePayload(row.originalStock, row.stock_boxes)"
                                class="text-text-muted text-xs mt-1.5"
                            >
                                {{ describeStockChange(row.originalStock, row.stock_boxes, stockUnit.short) }}
                            </p>
                        </div>

                        <div class="space-y-1.5 sm:space-y-0">
                            <FieldLabel
                                :html-for="`minimum_stock-${row.id}`"
                                text="Stock mínimo"
                                class="sm:sr-only"
                            />
                            <InputNumberCustom
                                :id="`minimum_stock-${row.id}`"
                                v-model="row.minimum_stock"
                                :error="row.errors.minimum_stock"
                                :min="0"
                                placeholder="0"
                                @input="row.errors.minimum_stock = ''"
                                @keydown.enter="addRowOnEnter($event, row)"
                                :max-fraction-digits="0"
                            />
                            <p v-if="row.errors.minimum_stock" class="text-danger text-xs mt-1.5">
                                {{ row.errors.minimum_stock }}
                            </p>
                        </div>
                    </div>

                    <!-- Mismo alto que los inputs para quedar centrado con ellos desde sm -->
                    <button
                        type="button"
                        @click="emit('remove', row)"
                        :disabled="rows.length === 1 || deletingRowId === row.id"
                        class="w-8 h-10 shrink-0 flex items-center justify-center rounded text-text-muted hover:text-danger disabled:opacity-30 disabled:hover:text-text-muted disabled:cursor-not-allowed transition-colors cursor-pointer"
                        :aria-label="row.color ? `Eliminar color ${row.color}` : 'Eliminar color'"
                        title="Eliminar color"
                    >
                        <svg
                            class="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M6 6l12 12M6 18L18 6"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <button
            type="button"
            @click="addRow"
            class="mt-3 w-full border border-dashed border-border rounded-md py-2 text-sm text-text-muted hover:text-text hover:border-accent transition-colors select-none cursor-pointer"
        >
            + Agregar color
        </button>
    </div>
</template>

<script setup>
import { nextTick } from "vue";
import InputTextCustom from "@/components/widgets/InputTextCustom.vue";
import InputNumberCustom from "@/components/widgets/InputNumberCustom.vue";
import FieldLabel from "@/components/widgets/labels/FieldLabel.vue";
import { createColorRow } from "@/lib/productForm";
import { describeStockChange, stockChangePayload } from "@/lib/stockChange";

// Colores de una medida (lista repetible): cada fila se convierte en su propia
// variante. `rows` es el arreglo del grupo en la vista; agregar una fila es
// local, pero quitarla se le pide a la vista con `remove`: una fila ya guardada
// necesita confirmación y DELETE.
const rows = defineModel("rows", { type: Array, required: true });

defineProps({
    // { short, label } de variantStockUnit(): cajas o piezas.
    stockUnit: { type: Object, required: true },
    // Fila cuya variante se está eliminando (su botón queda deshabilitado).
    deletingRowId: { type: String, default: null },
});

const emit = defineEmits(["remove"]);

// Sin mouse: el foco pasa al color de la fila nueva para capturarlo de inmediato.
async function addRow() {
    const row = createColorRow();
    rows.value.push(row);
    await nextTick();
    document.getElementById(`color-${row.id}`)?.focus();
}

// Como en una hoja de cálculo: Enter en el último campo de la última fila abre
// una fila nueva. Solo si esa fila ya tiene color; si no, el Enter sigue de
// largo al siguiente campo (ver advanceOnEnter en lib/formKeyboard.js), así no
// se acumulan filas vacías. preventDefault le avisa al form que ya se resolvió.
function addRowOnEnter(event, row) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (row !== rows.value.at(-1) || !row.color.trim()) return;
    event.preventDefault();
    addRow();
}
</script>

<style scoped></style>
