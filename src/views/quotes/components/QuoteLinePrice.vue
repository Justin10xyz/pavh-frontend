<template>
    <!-- Precio de lista, informativo: en cotización no se edita -->
    <div class="space-y-1.5 sm:space-y-0">
        <span class="text-xs font-medium text-text-muted block sm:sr-only">
            {{
                row.variant
                    ? `Precio unitario (${isPieceLine(row) ? "pieza" : "m²"})`
                    : "Precio unitario"
            }}
        </span>
        <p v-if="boxPrice !== null" class="sm:h-8.5 text-sm mt-2 tabular-nums">
            {{ formatCurrency(boxPrice) }}/caja
        </p>
        <!-- Secundario solo bajo el precio por caja; sin él (simple, por
		     pieza, sin m² por caja) es el precio principal de la línea. -->
        <p
            class="flex items-center tabular-nums"
            :class="boxPrice !== null ? 'text-xs text-text-muted' : 'sm:h-8.5 text-sm mt-2'"
        >
            {{
                !row.variant
                    ? formatCurrency(simpleProductListPrice)
                    : isPieceLine(row)
                        ? `${formatCurrency(row.variant.price_per_box)}/pieza`
                        : `${formatCurrency(row.variant.price_per_m2)}/m²`
            }}
        </p>
    </div>
</template>

<script setup>
import { computed } from "vue";
import { formatCurrency } from "@/lib/formatCurrency";
import * as documentLines from "@/lib/documentLines";
import { useLineProducts } from "@/composables/useLineProducts";

// Celda de precio de una línea de cotización (slot `#price` de
// DocumentLinesTable en QuoteFormView). Solo lectura.
const props = defineProps({
    row: { type: Object, required: true },
});

const { isPieceLine, simpleProductFor, linePriceType } = useLineProducts();

// En cotización el precio no se edita: todo se calcula al precio de lista (en
// productos simples, el del tipo elegido; el backend lo resuelve igual).
const simpleProductListPrice = computed(() =>
    documentLines.simpleProductPrice(simpleProductFor(props.row), linePriceType(props.row)),
);

const boxPrice = computed(() =>
    documentLines.boxPrice(props.row, isPieceLine(props.row), props.row.variant?.price_per_m2),
);
</script>

<style scoped></style>
