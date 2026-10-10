<template>
	<div class="p-2">
		<div class="flex items-center justify-between mb-4">
			<h1 class="font-serif text-xl text-primary">Inventario</h1>
			<RouterLink
				v-if="activeSection === 'floors'"
				:to="{ name: 'products.create' }"
				class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors inline-flex items-center select-none"
			>
				Nuevo producto
			</RouterLink>
		</div>

		<div class="flex items-center gap-2 mb-4" role="group" aria-label="Sección del inventario">
			<button
				v-for="section in sections"
				:key="section.key"
				type="button"
				class="text-sm px-3 py-2 bg-surface border rounded-md transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
				:class="
					activeSection === section.key
						? 'border-accent text-text font-medium'
						: 'border-border text-text-muted hover:text-text'
				"
				:aria-pressed="activeSection === section.key"
				@click="selectSection(section.key)"
			>
				{{ section.label }}
			</button>
		</div>

		<SimpleProductsSection v-if="activeSection === 'other'" />

		<div v-else-if="inventory.loading" class="text-text-muted text-sm">Cargando productos…</div>
		<div v-else-if="inventory.error" class="text-danger text-sm">{{ inventory.error }}</div>

		<template v-else>
			<InventoryFilters
				v-model:searchQuery="searchQuery"
				v-model:selectedCategory="selectedCategory"
				v-model:lowStockOnly="lowStockOnly"
				:categoryOptions="categoryOptions"
				@clear-filters="clearFilters"
			/>

			<div
				v-if="filteredProducts.length === 0"
				class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface"
			>
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
		:url="stockDialogVariant ? `/api/product-variants/${stockDialogVariant.id}/stock` : null"
		:stock="stockDialogVariant?.stock_boxes"
		stock-unit="cj"
		quantity-label="Cantidad (cajas)"
		:subtitle="stockDialogVariant?.color"
		@stock-updated="onVariantStockUpdated"
	/>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useInventoryStore } from "@/stores/inventory";

import InventoryFilters from "./components/InventoryFilters.vue";
import InventoryTable from "./components/InventoryTable.vue";
import StockAdjustDialog from "./components/StockAdjustDialog.vue";
import SimpleProductsSection from "./components/SimpleProductsSection.vue";

const route = useRoute();
const router = useRouter();
const inventory = useInventoryStore();

onMounted(() => {
	if (!inventory.initialized) inventory.fetchProducts();
});

// La sección activa vive en la URL (?seccion=otros) para que, al volver de
// crear/editar un producto simple, se regrese a "Otros productos" y no a pisos.
const sections = [
	{ key: "floors", label: "Catálogo de pisos" },
	{ key: "other", label: "Otros productos" },
];

const activeSection = computed(() => (route.query.seccion === "otros" ? "other" : "floors"));

function selectSection(key) {
	router.replace({ query: key === "other" ? { seccion: "otros" } : {} });
}

function editProduct(productId) {
	router.push({ name: "products.edit", params: { id: productId } });
}

const stockDialogOpen = ref(false);
const stockDialogVariant = ref(null);

function openStockDialog(variant) {
	stockDialogVariant.value = variant;
	stockDialogOpen.value = true;
}

function onVariantStockUpdated(updatedVariant) {
	inventory.updateVariantStock(updatedVariant.id, {
		stock_boxes: updatedVariant.stock_boxes,
		low_stock: updatedVariant.low_stock,
	});
}

// Filters logic
const searchQuery = ref("");
const selectedCategory = ref("");
const lowStockOnly = ref(false);

function clearFilters() {
	searchQuery.value = "";
	selectedCategory.value = "";
	lowStockOnly.value = false;
}

const categoryOptions = computed(() => {
	const set = new Set(inventory.products.map((p) => p.category).filter(Boolean));
	return Array.from(set).sort();
});

function normalize(str) {
	return (str ?? "")
		.toString()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}

const visibleVariantsByProduct = computed(() => {
	const map = new Map();
	const q = normalize(searchQuery.value);

	for (const product of inventory.products) {
		let variants = product.variants;

		if (lowStockOnly.value) {
			variants = variants.filter((v) => v.low_stock);
		}

		if (q) {
			const productMatches = normalize(product.name).includes(q);
			if (!productMatches) {
				variants = variants.filter(
					(v) => normalize(v.color).includes(q) || normalize(v.code).includes(q),
				);
			}
		}

		map.set(product.id, variants);
	}

	return map;
});

const filteredProducts = computed(() => {
	return inventory.products.filter((product) => {
		if (selectedCategory.value && product.category !== selectedCategory.value) return false;
		const variants = visibleVariantsByProduct.value.get(product.id) ?? [];
		return variants.length > 0;
	});
});
</script>
