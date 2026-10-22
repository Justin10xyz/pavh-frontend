<template>
    <div class="border border-border rounded-md overflow-hidden bg-surface">
        <div class="group-header">
            <button
                type="button"
                class="group-header-toggle cursor-pointer"
                @click="expanded = !expanded"
                title="Clic para ver stock por color"
                :aria-expanded="expanded"
            >
                <span class="toggle-btn" :class="{ 'is-open': expanded }">
                    <svg viewBox="0 0 8 8" width="8" height="8" aria-hidden="true">
                        <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
                    </svg>
                </span>
                <!-- Cada bloque envuelve como unidad: en lg+ cabe todo en una
                     línea; en tablet baja precio/specs a una segunda línea. -->
                <span class="flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span class="flex items-center gap-2 whitespace-nowrap">
                        <span class="font-medium text-text">{{ group.size }}</span>
                        <!-- Pisos por pieza: sin PEI/ETT, un solo precio (por
                             pieza) y sin datos de logística por caja. -->
                        <template v-if="!soldByPiece">
                            <span class="spec-badge">PEI {{ group.pei }}</span>
                            <span class="spec-badge">ETT {{ group.ett }}</span>
                        </template>
                        <!-- Caras sí aplica a pisos por pieza; sin dato no se muestra. -->
                        <span v-if="formatFaceCount(group.face_count)" class="spec-badge">{{
                            formatFaceCount(group.face_count)
                        }}</span>
                        <CommissionBadge v-if="group.commission_category" :category="group.commission_category" />
                    </span>
                    <span v-if="soldByPiece" class="flex items-center gap-2 whitespace-nowrap">
                        <span class="font-semibold text-primary tabular-nums"
                        >{{ formatCurrency(group.price_per_box) }}/pieza</span
                        >
                    </span>
                    <span v-else class="flex items-center gap-2 whitespace-nowrap">
                        <span class="font-semibold text-primary tabular-nums"
                        >{{ formatCurrency(group.price_per_box) }}/caja</span
                        >
                        <span class="font-semibold text-primary tabular-nums"
                        >{{ formatCurrency(group.price_per_m2) }}/m²</span
                        >
                    </span>
                    <span v-if="!soldByPiece" class="text-text-muted">
                        {{ group.pieces_per_box }} pzas/caja ·
                        {{ Number(group.m2_per_box).toFixed(2) }} m²/caja ·
                        {{ group.kilos_per_box }} kg/caja
                    </span>
                </span>
                <span class="shrink-0 flex items-center gap-2 whitespace-nowrap">
                    <span v-if="lowStockCount(group.variants) > 0" class="low-stock-badge">
                        {{ lowStockLabel(group.variants) }}
                    </span>
                    <span class="text-text-muted">{{ group.variants.length }} colores</span>
                </span>
            </button>
        </div>

        <Transition
            name="collapse"
            @enter="onCollapseEnter"
            @after-enter="clearCollapseHeight"
            @leave="onCollapseLeave"
            @after-leave="clearCollapseHeight"
        >
            <div v-if="expanded" class="overflow-x-auto">
                <table class="variants-table w-full text-xs border-t border-border">
                    <thead>
                        <tr class="text-text-muted uppercase text-xs">
                            <th class="text-left font-medium py-1.5 pl-3 sm:pl-8">Color</th>
                            <th class="hidden md:table-cell text-left font-medium py-1.5">Código</th>
                            <th class="text-left font-medium py-1.5">Stock</th>
                            <th class="text-left font-medium py-1.5 pr-3 sm:pr-6">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="variant in group.variants"
                            :key="variant.id"
                            class="border-t border-border hover:bg-bg/60 transition-colors"
                        >
                            <td class="py-1.5 pl-3 sm:pl-8 text-sm">
                                {{ variant.color }}
                                <!-- Sin columna Código por debajo de md: va debajo del color -->
                                <span class="block md:hidden text-text-muted font-mono text-xs">{{
                                    variant.code
                                }}</span>
                            </td>
                            <td class="hidden md:table-cell py-1.5 text-text-muted font-mono text-xs">
                                {{ variant.code }}
                            </td>
                            <td
                                class="py-1.5 text-sm"
                                :class="
                                    !isTracked(variant)
                                        ? 'text-text-muted'
                                        : variant.low_stock
                                            ? 'text-danger font-medium'
                                            : 'text-text'
                                "
                            >
                                {{ isTracked(variant) ? `${variant.stock_boxes} ${stockUnit.short}` : "—" }}
                            </td>
                            <td class="py-1.5 pr-3 sm:pr-6">
                                <div class="flex items-center justify-start gap-1.5">
                                    <StockStatusBadge
                                        :tracked="isTracked(variant)"
                                        :low-stock="variant.low_stock"
                                    />
                                    <div class="flex items-center justify-end gap-1.5 ml-auto">
                                        <button
                                            type="button"
                                            @click="emit('open-stock-dialog', variant)"
                                            class="flex items-center p-1.5 lg:p-1 rounded text-text-muted hover:bg-bg hover:text-accent transition-colors cursor-pointer"
                                            :aria-label="stockActionLabel(variant)"
                                            :title="stockActionLabel(variant)"
                                        >
                                            <i
                                                class="ti text-base"
                                                :class="
                                                    isTracked(variant)
                                                        ? 'ti-adjustments-horizontal'
                                                        : 'ti-circle-plus'
                                                "
                                            ></i>
                                        </button>
                                        <button
                                            type="button"
                                            @click="emit('open-movements-dialog', variant)"
                                            class="flex items-center p-1.5 lg:p-1 rounded text-text-muted hover:bg-bg hover:text-accent transition-colors cursor-pointer"
                                            aria-label="Ver historial de stock"
                                            title="Ver historial de stock"
                                        >
                                            <i class="ti ti-history text-base"></i>
                                        </button>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { computed } from "vue";
import CommissionBadge from "@/components/widgets/badges/CommissionBadge.vue";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatFaceCount } from "@/lib/variantSpecs";
import { isSoldByPiece, variantStockUnit } from "@/lib/unitTypes";
import { isTracked, lowStockCount, lowStockLabel } from "@/lib/variantStock";
import { clearCollapseHeight, onCollapseEnter, onCollapseLeave } from "@/lib/collapseTransition";
import StockStatusBadge from "./StockStatusBadge.vue";

// Una medida dentro de la expansión de un producto en InventoryTable: su ficha
// (precio, specs, aviso de stock bajo) y, al abrirla, el stock por color. Si
// está abierta lo guarda InventoryTable (`v-model:expanded`), porque debe
// sobrevivir a que se colapse el producto y se monte de nuevo.

const expanded = defineModel("expanded", { type: Boolean, default: false });

const props = defineProps({
    group: { type: Object, required: true },
    // La unidad de venta vive en el producto, no en la variante.
    unitType: { type: String, default: null },
});

// Los diálogos de stock viven en InventoryView; InventoryTable agrega el producto.
const emit = defineEmits(["open-stock-dialog", "open-movements-dialog"]);

const soldByPiece = computed(() => isSoldByPiece(props.unitType));
const stockUnit = computed(() => variantStockUnit(props.unitType));

function stockActionLabel(variant) {
    return isTracked(variant) ? "Ajustar stock" : "Activar seguimiento de stock";
}
</script>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
	overflow: hidden;
	transition:
		height 200ms ease,
		opacity 200ms ease;
}
.collapse-enter-from,
.collapse-leave-to {
	opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
	.collapse-enter-active,
	.collapse-leave-active {
		transition: none;
	}
}

.toggle-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.25rem;
	height: 1.25rem;
	border-radius: 0.25rem;
	color: var(--color-text-muted);
	flex-shrink: 0;
}
.toggle-btn:hover {
	background: var(--color-bg);
	color: var(--color-text);
}
.toggle-btn svg {
	transition: transform 150ms ease;
}
.toggle-btn.is-open svg {
	transform: rotate(90deg);
}

/* Tabla de colores anidada: `.data-table` no la alcanza (solo la tabla raíz), así
   que lleva su propio espaciado — el mismo que antes heredaba de los estilos de
   la tabla principal. */
.variants-table th {
	padding: 0.5rem 0.75rem;
	background: var(--color-bg);
	border-bottom: 1px solid var(--color-border);
}
.variants-table td {
	padding: 0.375rem 0.75rem;
	vertical-align: middle;
}

.group-header {
	display: flex;
	align-items: stretch;
}
.group-header:hover {
	background: var(--color-bg);
}

.group-header-toggle {
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	flex: 1;
	min-width: 0;
	padding: 0.5rem 0.75rem;
	font-size: 0.75rem;
	text-align: left;
}

@media (min-width: 64rem) {
	.group-header-toggle {
		align-items: center;
	}
}

.low-stock-badge {
	font-size: 0.75rem;
	font-weight: 500;
	white-space: nowrap;
	color: var(--color-danger);
	background: color-mix(in oklab, var(--color-danger) 10%, transparent);
	border-radius: 0.25rem;
	padding: 0.125rem 0.5rem;
}

.spec-badge {
	font-size: 0.75rem;
	font-weight: 400;
	color: var(--color-text-muted);
	border: 1px solid var(--color-border);
	border-radius: 0.25rem;
	padding: 0.125rem 0.375rem;
}
</style>
