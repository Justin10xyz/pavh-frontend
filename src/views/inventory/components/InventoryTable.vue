<template>
    <div class="bg-surface border border-border rounded-md overflow-hidden">
        <DataTable
            :value="products"
            dataKey="id"
            :expandedRows="expandedRows"
            class="data-table inventory-table"
            :row-class="() => 'cursor-pointer'"
            @row-click="onRowClick"
        >
            <Column header="Producto">
                <template #body="{ data }">
                    <div class="flex items-center gap-2">
                        <button
                            type="button"
                            class="toggle-btn cursor-pointer"
                            :class="{ 'is-open': openRows[data.id] }"
                            @click="toggleRow(data.id)"
                            :aria-expanded="!!openRows[data.id]"
                            :aria-label="`Variantes de ${data.name}`"
                        >
                            <svg viewBox="0 0 8 8" width="8" height="8" aria-hidden="true">
                                <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
                            </svg>
                        </button>
                        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                            <span class="font-semibold text-primary text-sm">{{ data.name }}</span>
                            <span
                                class="text-xs text-text-muted border border-border rounded px-1.5 py-0.5"
                            >
                                {{ data.category }} · {{ data.supplier }} · {{ data.unit_type }}
                            </span>
                            <!-- Aviso visible sin expandir: con "Solo stock bajo" activo, evita
							     abrir producto y medida para saber dónde está el faltante. -->
                            <span
                                v-if="lowStockCount(visibleVariantsByProduct.get(data.id)) > 0"
                                class="low-stock-badge"
                            >
                                {{ lowStockLabel(visibleVariantsByProduct.get(data.id)) }}
                            </span>
                        </div>
                    </div>
                </template>
            </Column>

            <Column header="Variantes" style="width: 6rem">
                <template #body="{ data }">
                    <span class="text-text-muted">{{
                        visibleVariantsByProduct.get(data.id)?.length ?? 0
                    }}</span>
                </template>
            </Column>

            <!-- Editar abre el producto completo (todas sus medidas), así que vive
			     en la fila del producto y no en cada grupo de medida. -->
            <Column header="" body-class="w-px">
                <template #body="{ data }">
                    <button
                        type="button"
                        @click="emit('edit-product', data.id)"
                        class="flex items-center p-1.5 lg:p-1 rounded text-text-muted hover:bg-bg hover:text-accent transition-colors cursor-pointer"
                        :aria-label="`Editar ${data.name}`"
                        title="Editar producto"
                    >
                        <i class="ti ti-pencil text-base"></i>
                    </button>
                </template>
            </Column>

            <template #expansion="{ data }">
                <!-- `appear`: la fila de expansión se monta al abrir, así que la
				     animación de entrada corre al aparecer. -->
                <Transition
                    appear
                    name="collapse"
                    @enter="onCollapseEnter"
                    @after-enter="clearCollapseHeight"
                    @leave="onCollapseLeave"
                    @after-leave="onRowCollapsed(data.id)"
                >
                    <div v-if="openRows[data.id]">
                        <div class="bg-bg px-2 sm:px-4 py-2 space-y-1.5">
                            <VariantGroupPanel
                                v-for="group in groupVariants(visibleVariantsByProduct.get(data.id) ?? [])"
                                :key="group.key"
                                :group="group"
                                :unit-type="data.unit_type"
                                :expanded="isGroupExpanded(data.id, group.key)"
                                @update:expanded="(value) => setGroupExpanded(data.id, group.key, value)"
                                @open-stock-dialog="(variant) => emit('open-stock-dialog', variant, data)"
                                @open-movements-dialog="(variant) => emit('open-movements-dialog', variant, data)"
                            />
                        </div>
                    </div>
                </Transition>
            </template>
        </DataTable>
    </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { groupVariants } from "@/lib/groupVariants";
import { lowStockCount, lowStockLabel } from "@/lib/variantStock";
import { clearCollapseHeight, onCollapseEnter, onCollapseLeave } from "@/lib/collapseTransition";
import VariantGroupPanel from "./VariantGroupPanel.vue";

const props = defineProps({
    products: {
        type: Array,
        required: true,
    },
    visibleVariantsByProduct: {
        type: Map,
        required: true,
    },
    // Al montar, abre todos los productos recibidos y sus medidas (ej. al llegar
    // desde una alerta de stock bajo del Dashboard, ya filtrado a un producto).
    initiallyExpanded: {
        type: Boolean,
        default: false,
    },
});

// Los diálogos de stock reciben (variant, product): la variante no trae su
// unidad de venta, que vive en el producto (unit_type).
const emit = defineEmits(["edit-product", "open-stock-dialog", "open-movements-dialog"]);

// `expandedRows` = filas que PrimeVue tiene montadas; `openRows` = filas que el
// usuario dejó abiertas. Al cerrar, la fila sigue montada hasta que termina la
// animación de salida y entonces se quita de `expandedRows`.
const expandedRows = ref({});
const openRows = ref({});
const expandedGroups = ref({});

// Clic en cualquier parte de la fila abre/cierra sus variantes. Los botones
// (flecha, editar) ya tienen su propia acción, así que se ignoran aquí.
function onRowClick({ originalEvent, data }) {
    if (originalEvent.target.closest("button, a")) return;
    toggleRow(data.id);
}

function toggleRow(productId) {
    if (openRows.value[productId]) {
        openRows.value[productId] = false;
    } else {
        expandedRows.value = { ...expandedRows.value, [productId]: true };
        openRows.value[productId] = true;
    }
}

function onRowCollapsed(productId) {
    // Si se volvió a abrir durante la salida, la fila se queda montada.
    if (openRows.value[productId]) return;
    const rows = { ...expandedRows.value };
    delete rows[productId];
    expandedRows.value = rows;
}

function groupExpansionKey(productId, groupKey) {
    return `${productId}::${groupKey}`;
}

// Vive aquí y no en VariantGroupPanel: la expansión del producto se desmonta al
// cerrarlo, y las medidas que el usuario dejó abiertas deben seguir así al reabrirlo.
function setGroupExpanded(productId, groupKey, value) {
    expandedGroups.value[groupExpansionKey(productId, groupKey)] = value;
}

function isGroupExpanded(productId, groupKey) {
    return !!expandedGroups.value[groupExpansionKey(productId, groupKey)];
}

onMounted(() => {
    if (!props.initiallyExpanded) return;

    for (const product of props.products) {
        expandedRows.value[product.id] = true;
        openRows.value[product.id] = true;
        for (const group of groupVariants(props.visibleVariantsByProduct.get(product.id) ?? [])) {
            expandedGroups.value[groupExpansionKey(product.id, group.key)] = true;
        }
    }
});
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
/* Área táctil más amplia para el toggle de la fila (tablet); compacto desde lg. */
button.toggle-btn {
	width: 2rem;
	height: 2rem;
}
@media (min-width: 64rem) {
	button.toggle-btn {
		width: 1.25rem;
		height: 1.25rem;
	}
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

/* Estilos base de tabla en `.data-table` (main.css); aquí solo la fila de expansión. */
.inventory-table :deep([data-pc-section="rowexpansion"] > td) {
	padding: 0;
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
</style>
