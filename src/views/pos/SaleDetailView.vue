<template>
    <div class="p-2 max-w-5xl">
        <div v-if="sales.currentSaleLoading && !sale" class="text-text-muted text-sm">
            Cargando venta…
        </div>

        <div v-else-if="sales.currentSaleError" class="space-y-4">
            <p class="text-danger text-sm">{{ sales.currentSaleError }}</p>
            <button
                type="button"
                @click="goBack"
                class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
            >
                Volver
            </button>
        </div>

        <template v-else-if="sale">
            <!-- Header -->
            <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div class="flex items-start gap-3">
                    <!-- Volver en línea con el título, mismo patrón que QuoteDetailView.
					     Por debajo de lg solo la flecha. -->
                    <RouterLink
                        :to="{ name: 'pos.sales.index', query: sales.listQuery }"
                        aria-label="Volver a ventas"
                        title="Volver a ventas"
                        class="shrink-0 inline-flex items-center justify-center gap-1.5 h-8 w-8 lg:w-auto lg:px-3 bg-surface border border-border hover:bg-bg text-text-muted hover:text-text text-sm font-medium rounded-md transition-colors select-none"
                    >
                        <i class="ti ti-arrow-left text-base" aria-hidden="true"></i>
                        <span class="hidden lg:inline">Volver</span>
                    </RouterLink>
                    <div>
                        <h1 class="font-serif text-xl text-primary">{{ sale.folio }}</h1>
                        <p class="text-sm text-text-muted mt-0.5">
                            Registrada el {{ formatDateTime(sale.created_at) }}
                        </p>
                    </div>
                </div>

                <div class="flex flex-col items-end gap-1.5">
                    <div class="flex flex-wrap items-center justify-end gap-3">
                        <!-- Siguiente cliente: tras registrar, el form navega aquí en vez de
						     limpiarse. Separada de las acciones del documento. -->
                        <RouterLink
                            :to="{ name: 'pos.sales.create' }"
                            aria-label="Nueva venta"
                            title="Nueva venta"
                            class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-3 sm:px-4 rounded-md transition-colors select-none inline-flex items-center gap-2"
                        >
                            <i class="ti ti-plus text-base" aria-hidden="true"></i>
                            <span class="hidden sm:inline">Nueva venta</span>
                        </RouterLink>
                        <span class="hidden sm:block w-px h-6 bg-border" aria-hidden="true"></span>
                        <!-- Por debajo de sm solo ícono, igual que en QuoteDetailView -->
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
                            <dd v-if="sale.customer" class="text-text">
                                <div class="font-medium">{{ sale.customer.name }}</div>
                                <a
                                    v-if="sale.customer.phone"
                                    :href="`tel:${sale.customer.phone}`"
                                    class="block w-fit text-text-muted text-sm hover:text-text hover:underline"
                                >
                                    {{ sale.customer.phone }}
                                </a>
                                <a
                                    v-if="sale.customer.email"
                                    :href="`mailto:${sale.customer.email}`"
                                    class="block w-fit text-text-muted text-sm hover:text-text hover:underline"
                                >
                                    {{ sale.customer.email }}
                                </a>
                            </dd>
                            <dd v-else class="text-text-muted">Sin cliente</dd>
                        </div>

                        <!-- Solo si la venta vino de convertir una cotización (contraparte de
						     "Convertida en venta" en QuoteDetailView) -->
                        <div v-if="sale.quote" class="space-y-1">
                            <dt class="text-xs font-medium text-text-muted">
                                Convertida desde cotización
                            </dt>
                            <dd>
                                <RouterLink
                                    :to="{ name: 'quotes.show', params: { id: sale.quote.id } }"
                                    class="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                                >
                                    {{ sale.quote.folio }}
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
                                    <th class="text-right">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in sale.items" :key="item.id">
                                    <!-- Línea de producto simple: sin color/medida, cantidad en unidades -->
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
                                                <template v-if="formatFaceCount(item.product_variant?.face_count)">
                                                    · {{ formatFaceCount(item.product_variant?.face_count) }}
                                                </template>
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
                                            <template v-else
                                            >{{ formatQuantity(item.quantity) }} m²</template
                                            >
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

                    <!-- Totales -->
                    <div class="border-t border-border px-5 sm:px-6 py-4 flex justify-end">
                        <div class="w-full max-w-xs space-y-1.5">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-text-muted">Subtotal</span>
                                <span class="text-text">{{ formatCurrency(sale.subtotal) }}</span>
                            </div>
                            <div class="flex items-center justify-between text-sm font-medium">
                                <span class="text-text">Total</span>
                                <span class="text-text">{{ formatCurrency(sale.total) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSalesStore } from "@/stores/sales";
import WholesaleBadge from "@/components/widgets/badges/WholesaleBadge.vue";
import { useDocumentPdf } from "@/composables/useDocumentPdf";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatQuantity } from "@/lib/formatQuantity";
import { formatFaceCount } from "@/lib/variantSpecs";
import { isSoldByPiece } from "@/lib/unitTypes";
import { formatDateTime } from "@/lib/dates";

const route = useRoute();
const router = useRouter();
const sales = useSalesStore();

// Evita mostrar por un instante una venta distinta si el store aún trae la
// de una visita anterior.
const sale = computed(() => {
    const current = sales.currentSale;
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
    fetchPdf: sales.fetchSalePdf,
    filePrefix: "Venta",
    id: () => route.params.id,
    document: sale,
});

watch(
    () => route.params.id,
    (id) => {
        resetPdf();
        if (id) sales.fetchSale(id);
    },
    { immediate: true },
);

// Pisos por pieza: la unidad viene con la variante (product_variant.product.unit_type).
function isPieceLine(item) {
    return isSoldByPiece(item.product_variant?.product?.unit_type);
}

// Lo que valió cada caja: precio por m² × m² que cubre una caja, ambos tal
// como se guardaron en la línea (no el m2_per_box actual de la variante).
function boxPrice(item) {
    return Math.round(((Number(item.unit_price) * Number(item.quantity)) / item.boxes) * 100) / 100;
}

function goBack() {
    router.push({ name: "pos.sales.index", query: sales.listQuery });
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
