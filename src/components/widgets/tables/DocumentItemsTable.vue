<template>
    <div class="overflow-x-auto">
        <table class="items-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <!-- Variantes: cajas (lo que se entregó/cotizó) y debajo los m² que cubren -->
                    <th class="text-right">Cantidad</th>
                    <!-- Precio unitario se oculta por debajo de sm: el subtotal ya basta.
					     normal-case: el uppercase del encabezado convertiría m² en M² -->
                    <th class="text-right hidden sm:table-cell">
                        Precio unitario<span class="normal-case">/m²</span>
                    </th>
                    <th class="text-right">{{ lineTotalLabel }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in items" :key="item.id">
                    <!-- Línea de producto simple: sin color/medida ni cajas, cantidad en unidades -->
                    <template v-if="item.simple_product_id">
                        <td>
                            <div class="font-medium text-text">
                                {{ item.simple_product?.name ?? "—" }}
                            </div>
                        </td>
                        <td class="text-right text-text">
                            {{ formatQuantity(item.quantity) }} uds.
                        </td>
                        <td class="text-right text-text hidden sm:table-cell">
                            {{ formatCurrency(item.unit_price) }}
                            <div v-if="item.price_type === 'wholesale'" class="mt-0.5">
                                <WholesaleBadge />
                            </div>
                        </td>
                    </template>
                    <template v-else>
                        <td>
                            <div class="font-medium text-text">
                                {{ item.product_variant?.product?.name ?? "—" }}
                            </div>
                            <div class="text-text-muted text-xs">
                                {{ item.product_variant?.color }} ·
                                {{ item.product_variant?.size }}
                            </div>
                        </td>
                        <td class="text-right text-text">
                            <!-- Sin boxes: línea previa al cambio a cajas cuya variante no
							     tenía m2_per_box; se muestra tal cual se emitió, en m² -->
                            <!-- Variante por pieza: boxes son las piezas, sin m² (como un simple) -->
                            <template v-if="isPieceLine(item)">
                                {{ item.boxes }} pzas
                            </template>
                            <template v-else-if="item.boxes">
                                {{ item.boxes }}
                                {{ item.boxes === 1 ? "caja" : "cajas" }}
                                <div class="text-text-muted text-xs tabular-nums">
                                    {{ formatQuantity(item.quantity) }} m²
                                </div>
                            </template>
                            <template v-else>{{ formatQuantity(item.quantity) }} m²</template>
                        </td>
                        <td class="text-right text-text hidden sm:table-cell">
                            <!-- Variante por pieza: el precio unitario ya es por pieza -->
                            <template v-if="isPieceLine(item)">
                                {{ formatCurrency(item.unit_price) }}
                            </template>
                            <template v-else>
                                <div v-if="item.boxes">
                                    {{ formatCurrency(boxPrice(item)) }}/caja
                                </div>
                                <span class="text-text-muted text-xs tabular-nums">
                                    {{ formatCurrency(item.unit_price) }}/m²
                                </span>
                            </template>
                        </td>
                    </template>
                    <td class="text-right text-text">
                        {{ formatCurrency(item.line_total) }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
import WholesaleBadge from "@/components/widgets/badges/WholesaleBadge.vue";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatQuantity } from "@/lib/formatQuantity";
import { isSoldByPiece } from "@/lib/unitTypes";

// Líneas de un documento ya emitido (cotización, comprobante), de solo lectura.
// Recibe los items tal como los serializa el backend (QuoteItemResource /
// ComprobanteItemResource), con product_variant.product.unit_type cargado para
// distinguir pisos por pieza. Los totales los pone cada vista debajo, porque
// cambian por documento.
defineProps({
    items: { type: Array, required: true },
    // Encabezado de la última columna: "Subtotal" en cotización, "Importe" en
    // comprobante (como su PDF).
    lineTotalLabel: { type: String, default: "Subtotal" },
});

// Pisos por pieza: la unidad viene con la variante (product_variant.product.unit_type).
function isPieceLine(item) {
    return isSoldByPiece(item.product_variant?.product?.unit_type);
}

// Lo que valió cada caja: precio por m² × m² que cubre una caja, ambos tal
// como se guardaron en la línea (no el m2_per_box actual de la variante).
function boxPrice(item) {
    return Math.round(((Number(item.unit_price) * Number(item.quantity)) / item.boxes) * 100) / 100;
}
</script>

<style scoped>
.items-table {
	width: 100%;
	border-collapse: collapse;
}
.items-table thead th {
	font-size: 0.75rem;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.03em;
	color: var(--color-text-muted);
	background: var(--color-bg);
	padding: 0.5rem 0.75rem;
	border-top: 1px solid var(--color-border);
	border-bottom: 1px solid var(--color-border);
}
.items-table thead th:not(.text-right) {
	text-align: left;
}
.items-table tbody td {
	padding: 0.5rem 0.75rem;
	vertical-align: middle;
	border-bottom: 1px solid var(--color-border);
	font-size: 0.875rem;
}
.items-table tbody tr:last-child td {
	border-bottom: none;
}
.items-table th:first-child,
.items-table td:first-child {
	padding-left: 1.5rem;
}
.items-table th:last-child,
.items-table td:last-child {
	padding-right: 1.5rem;
}
</style>
