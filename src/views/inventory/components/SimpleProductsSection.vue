<template>
	<div>
		<InventoryFilters
			v-model:searchQuery="searchQuery"
			v-model:selectedCategory="selectedCategory"
			:categoryOptions="categoryOptions"
			search-placeholder="Buscar por nombre…"
			:show-low-stock-filter="false"
			@clear-filters="clearFilters"
		/>

		<div v-if="simpleProducts.loading" class="text-text-muted text-sm">Cargando productos…</div>
		<div v-else-if="simpleProducts.error" class="text-danger text-sm">
			{{ simpleProducts.error }}
		</div>

		<div
			v-else-if="filteredProducts.length === 0"
			class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface"
		>
			{{
				simpleProducts.simpleProducts.length === 0
					? "Aún no hay otros productos registrados."
					: "No se encontraron productos con esos filtros."
			}}
		</div>

		<div v-else class="bg-surface border border-border rounded-md overflow-x-auto">
			<DataTable :value="filteredProducts" dataKey="id" class="simple-products-table">
				<Column header="Nombre">
					<template #body="{ data }">
						<span class="font-medium text-text">{{ data.name }}</span>
						<!-- Sin columna Categoría por debajo de sm: va debajo del nombre -->
						<span class="block sm:hidden text-xs text-text-muted">{{
							categoryName(data)
						}}</span>
					</template>
				</Column>

				<Column
					header="Categoría"
					header-class="hidden sm:table-cell"
					body-class="hidden sm:table-cell"
				>
					<template #body="{ data }">
						<span class="text-muted">{{ categoryName(data) }}</span>
					</template>
				</Column>

				<Column header="Precio" body-class="whitespace-nowrap">
					<template #body="{ data }">
						<span class="font-semibold text-primary tabular-nums">{{
							formatCurrency(data.price)
						}}</span>
					</template>
				</Column>

				<Column header="Stock">
					<template #body="{ data }">
						<div class="flex items-center gap-2">
							<span class="text-text tabular-nums">{{ data.stock_quantity }}</span>
						</div>
					</template>
				</Column>

				<Column header="" body-class="w-px">
					<template #body="{ data }">
						<div class="flex items-center">
							<button
								type="button"
								class="flex items-center p-1.5 lg:p-1 rounded text-text-muted hover:bg-bg hover:text-accent transition-colors cursor-pointer"
								aria-label="Ajustar stock"
								title="Ajustar stock"
								@click="openStockDialog(data)"
							>
								<i class="ti ti-adjustments-horizontal text-base"></i>
							</button>
							<button
								type="button"
								class="flex items-center p-1.5 lg:p-1 rounded text-text-muted hover:bg-bg hover:text-accent transition-colors cursor-pointer"
								aria-label="Ver historial de stock"
								title="Ver historial de stock"
								@click="openMovementsDialog(data)"
							>
								<i class="ti ti-history text-base"></i>
							</button>
							<button
								type="button"
								class="flex items-center p-1.5 lg:p-1 rounded text-text-muted hover:bg-bg hover:text-accent transition-colors cursor-pointer"
								aria-label="Editar producto"
								title="Editar producto"
								@click="editProduct(data.id)"
							>
								<i class="ti ti-pencil text-base"></i>
							</button>
						</div>
					</template>
				</Column>
			</DataTable>
		</div>

		<StockAdjustDialog
			v-model:visible="stockDialogOpen"
			:url="stockDialogProduct ? `/api/simple-products/${stockDialogProduct.id}/stock` : null"
			:stock="stockDialogProduct?.stock_quantity"
			stock-unit="unidades"
			quantity-label="Cantidad (unidades)"
			:subtitle="stockDialogProduct?.name"
			@stock-updated="onStockUpdated"
		/>

		<StockMovementsDialog
			v-model:visible="movementsDialogOpen"
			:url="
				movementsDialogProduct
					? `/api/simple-products/${movementsDialogProduct.id}/stock-movements`
					: null
			"
			:stock="movementsDialogProduct?.stock_quantity"
			stock-unit="unidades"
			:subtitle="movementsDialogProduct?.name"
		/>
	</div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useSimpleProductsStore } from "@/stores/simpleProducts";
import { useCatalogsStore } from "@/stores/catalogs";
import { formatCurrency } from "@/lib/formatCurrency";
import InventoryFilters from "./InventoryFilters.vue";
import StockAdjustDialog from "./StockAdjustDialog.vue";
import StockMovementsDialog from "./StockMovementsDialog.vue";

const router = useRouter();
const simpleProducts = useSimpleProductsStore();
const catalogs = useCatalogsStore();

onMounted(() => {
	if (!simpleProducts.initialized) simpleProducts.fetchSimpleProducts();
	if (!catalogs.initialized) catalogs.fetchCatalogs();
});

// GET /api/simple-products no carga `category`, así que el nombre se resuelve
// contra el catálogo de categorías (ya cacheado y actualizado in-place al editar).
const categoryNamesById = computed(() => new Map(catalogs.categories.map((c) => [c.id, c.name])));

function categoryName(product) {
	return categoryNamesById.value.get(product.category_id) ?? "—";
}

function editProduct(id) {
	router.push({ name: "inventory.simpleProducts.edit", params: { id } });
}

const stockDialogOpen = ref(false);
const stockDialogProduct = ref(null);

function openStockDialog(product) {
	stockDialogProduct.value = product;
	stockDialogOpen.value = true;
}

function onStockUpdated(product) {
	simpleProducts.updateSimpleProductStock(product.id, { stock_quantity: product.stock_quantity });
}

const movementsDialogOpen = ref(false);
const movementsDialogProduct = ref(null);

function openMovementsDialog(product) {
	movementsDialogProduct.value = product;
	movementsDialogOpen.value = true;
}

// Filtros — estado propio, independiente del catálogo de pisos.
const searchQuery = ref("");
const selectedCategory = ref("");

function clearFilters() {
	searchQuery.value = "";
	selectedCategory.value = "";
}

// Solo las categorías que de verdad tienen productos aquí, igual que en pisos.
const categoryOptions = computed(() => {
	const set = new Set(
		simpleProducts.simpleProducts.map(categoryName).filter((name) => name !== "—"),
	);
	return Array.from(set).sort();
});

function normalize(str) {
	return (str ?? "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const filteredProducts = computed(() => {
	const q = normalize(searchQuery.value);

	return simpleProducts.simpleProducts.filter((product) => {
		if (selectedCategory.value && categoryName(product) !== selectedCategory.value)
			return false;
		if (q && !normalize(product.name).includes(q)) return false;
		return true;
	});
});
</script>

<style scoped>
.simple-products-table :deep(table) {
	width: 100%;
	border-collapse: collapse;
}
.simple-products-table :deep(thead th) {
	text-align: left;
	font-size: 0.75rem;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.03em;
	color: var(--color-text-muted);
	background: var(--color-bg);
	padding: 0.5rem 0.75rem;
	border-bottom: 1px solid var(--color-border);
}
.simple-products-table :deep(tbody > tr > td) {
	padding: 0.5rem 0.75rem;
	vertical-align: middle;
	border-bottom: 1px solid var(--color-border);
	font-size: 0.8125rem;
}
.simple-products-table :deep(tbody > tr:last-child > td) {
	border-bottom: none;
}
.simple-products-table :deep(tbody > tr) {
	transition: background-color 150ms ease;
}
.simple-products-table :deep(tbody > tr:hover) {
	background: color-mix(in oklab, var(--color-bg) 60%, transparent);
}
</style>
