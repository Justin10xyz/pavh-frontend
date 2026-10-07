<template>
	<div class="p-2">
		<div class="flex items-center justify-between mb-4">
			<h1 class="font-serif text-xl text-primary">Inventario</h1>
			<RouterLink
				:to="{ name: 'products.create' }"
				class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors inline-flex items-center select-none"
			>
				Nuevo producto
			</RouterLink>
		</div>

		<div v-if="inventory.loading" class="text-text-muted text-sm">Cargando productos…</div>
		<div v-else-if="inventory.error" class="text-danger text-sm">{{ inventory.error }}</div>

		<template v-else>
			<InventoryFilters
				v-model:searchQuery="searchQuery"
				v-model:selectedCategory="selectedCategory"
				v-model:lowStockOnly="lowStockOnly"
				:categoryOptions="categoryOptions"
				@clear-filters="clearFilters"
			/>

			<div v-if="filteredProducts.length === 0" class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface">
				No se encontraron productos con esos filtros.
			</div>

			<InventoryTable
				v-else
				:products="filteredProducts"
				:visibleVariantsByProduct="visibleVariantsByProduct"
				@edit-product="editProduct"
				@open-stock-dialog="openStockDialog"
			/>
		</template>
	</div>

	<StockAdjustDialog
		v-model:visible="stockDialogOpen"
		:variant="stockDialogVariant"
	/>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '@/stores/inventory'

import InventoryFilters from './components/InventoryFilters.vue'
import InventoryTable from './components/InventoryTable.vue'
import StockAdjustDialog from './components/StockAdjustDialog.vue'

const router = useRouter()
const inventory = useInventoryStore()

onMounted(() => {
	if (!inventory.initialized) inventory.fetchProducts()
})

function editProduct(productId) {
	router.push({ name: 'products.edit', params: { id: productId } })
}

const stockDialogOpen = ref(false)
const stockDialogVariant = ref(null)

function openStockDialog(variant) {
	stockDialogVariant.value = variant
	stockDialogOpen.value = true
}

// Filters logic
const searchQuery = ref('')
const selectedCategory = ref('')
const lowStockOnly = ref(false)

function clearFilters() {
	searchQuery.value = ''
	selectedCategory.value = ''
	lowStockOnly.value = false
}

const categoryOptions = computed(() => {
	const set = new Set(inventory.products.map((p) => p.category).filter(Boolean))
	return Array.from(set).sort()
})

function normalize(str) {
	return (str ?? '')
		.toString()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
}

const visibleVariantsByProduct = computed(() => {
	const map = new Map()
	const q = normalize(searchQuery.value)

	for (const product of inventory.products) {
		let variants = product.variants

		if (lowStockOnly.value) {
			variants = variants.filter((v) => v.low_stock)
		}

		if (q) {
			const productMatches = normalize(product.name).includes(q)
			if (!productMatches) {
				variants = variants.filter(
					(v) => normalize(v.color).includes(q) || normalize(v.code).includes(q)
				)
			}
		}

		map.set(product.id, variants)
	}

	return map
})

const filteredProducts = computed(() => {
	return inventory.products.filter((product) => {
		if (selectedCategory.value && product.category !== selectedCategory.value) return false
		const variants = visibleVariantsByProduct.value.get(product.id) ?? []
		return variants.length > 0
	})
})
</script>
