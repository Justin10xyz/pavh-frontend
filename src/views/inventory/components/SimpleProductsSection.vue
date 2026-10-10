<template>
	<div>
		<div class="flex items-start gap-3">
			<InventoryFilters
				v-model:searchQuery="searchQuery"
				v-model:selectedCategory="selectedCategory"
				:categoryOptions="categoryOptions"
				search-placeholder="Buscar por nombre…"
				:show-low-stock-filter="false"
				class="flex-1"
				@clear-filters="clearFilters"
			/>
			<RouterLink
				:to="{ name: 'inventory.simpleProducts.create' }"
				class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-10 px-4 rounded-md transition-colors inline-flex items-center shrink-0 select-none"
			>
				Nuevo producto
			</RouterLink>
		</div>

		<div v-if="simpleProducts.loading" class="text-text-muted text-sm">Cargando productos…</div>
		<div v-else-if="simpleProducts.error" class="text-danger text-sm">{{ simpleProducts.error }}</div>

		<div
			v-else-if="filteredProducts.length === 0"
			class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface"
		>
			{{ simpleProducts.simpleProducts.length === 0 ? 'Aún no hay otros productos registrados.' : 'No se encontraron productos con esos filtros.' }}
		</div>

		<div v-else class="bg-surface border border-border rounded-md overflow-hidden">
			<DataTable :value="filteredProducts" dataKey="id" class="simple-products-table">
				<Column header="Nombre">
					<template #body="{ data }">
						<span class="font-medium text-text">{{ data.name }}</span>
					</template>
				</Column>

				<Column header="Categoría">
					<template #body="{ data }">
						<span class="text-text-muted">{{ categoryName(data) }}</span>
					</template>
				</Column>

				<Column header="Precio" style="width: 9rem">
					<template #body="{ data }">
						<span class="text-text">{{ formatCurrency(data.price) }}</span>
					</template>
				</Column>

				<Column header="Stock" style="width: 8rem">
					<template #body="{ data }">
						<div class="flex items-center gap-2">
							<span class="text-text">{{ data.stock_quantity }}</span>
							<button
								type="button"
								class="text-text-muted hover:text-accent transition-colors"
								aria-label="Ajustar stock"
								title="Ajustar stock"
								@click="openStockDialog(data)"
							>
								<i class="ti ti-adjustments-horizontal text-[13px]"></i>
							</button>
						</div>
					</template>
				</Column>

				<Column header="" style="width: 3rem">
					<template #body="{ data }">
						<button
							type="button"
							class="text-text-muted hover:text-accent transition-colors"
							aria-label="Editar producto"
							title="Editar producto"
							@click="editProduct(data.id)"
						>
							<i class="ti ti-pencil text-[15px]"></i>
						</button>
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
	</div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useSimpleProductsStore } from '@/stores/simpleProducts'
import { useCatalogsStore } from '@/stores/catalogs'
import { formatCurrency } from '@/lib/formatCurrency'
import InventoryFilters from './InventoryFilters.vue'
import StockAdjustDialog from './StockAdjustDialog.vue'

const router = useRouter()
const simpleProducts = useSimpleProductsStore()
const catalogs = useCatalogsStore()

onMounted(() => {
	if (!simpleProducts.initialized) simpleProducts.fetchSimpleProducts()
	if (!catalogs.initialized) catalogs.fetchCatalogs()
})

// GET /api/simple-products no carga `category`, así que el nombre se resuelve
// contra el catálogo de categorías (ya cacheado y actualizado in-place al editar).
const categoryNamesById = computed(() => new Map(catalogs.categories.map((c) => [c.id, c.name])))

function categoryName(product) {
	return categoryNamesById.value.get(product.category_id) ?? '—'
}

function editProduct(id) {
	router.push({ name: 'inventory.simpleProducts.edit', params: { id } })
}

const stockDialogOpen = ref(false)
const stockDialogProduct = ref(null)

function openStockDialog(product) {
	stockDialogProduct.value = product
	stockDialogOpen.value = true
}

function onStockUpdated(product) {
	simpleProducts.updateSimpleProductStock(product.id, { stock_quantity: product.stock_quantity })
}

// Filtros — estado propio, independiente del catálogo de pisos.
const searchQuery = ref('')
const selectedCategory = ref('')

function clearFilters() {
	searchQuery.value = ''
	selectedCategory.value = ''
}

// Solo las categorías que de verdad tienen productos aquí, igual que en pisos.
const categoryOptions = computed(() => {
	const set = new Set(simpleProducts.simpleProducts.map(categoryName).filter((name) => name !== '—'))
	return Array.from(set).sort()
})

function normalize(str) {
	return (str ?? '')
		.toString()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
}

const filteredProducts = computed(() => {
	const q = normalize(searchQuery.value)

	return simpleProducts.simpleProducts.filter((product) => {
		if (selectedCategory.value && categoryName(product) !== selectedCategory.value) return false
		if (q && !normalize(product.name).includes(q)) return false
		return true
	})
})
</script>

<style scoped>
.simple-products-table :deep(table) {
	width: 100%;
	border-collapse: collapse;
}
.simple-products-table :deep(thead th) {
	text-align: left;
	font-size: 11px;
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
.simple-products-table :deep(tbody > tr:hover) {
	background: var(--color-bg);
}
</style>
