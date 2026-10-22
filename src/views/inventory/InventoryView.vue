<template>
    <div class="p-2">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h1 class="font-serif text-xl text-primary">Inventario</h1>
            <RouterLink
                :to="newProductRoute"
                class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-10 px-4 rounded-md transition-colors inline-flex items-center select-none"
            >
                Nuevo producto
            </RouterLink>
        </div>

        <div class="flex flex-wrap items-center gap-2 mb-4" role="group" aria-label="Sección del inventario">
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
            <p
                v-if="deleteError"
                class="text-danger text-sm mb-4 flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2"
            >
                <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
                {{ deleteError }}
            </p>

            <InventoryFilters
                v-model:searchQuery="searchQuery"
                v-model:selectedCategory="selectedCategory"
                v-model:selectedSupplier="selectedSupplier"
                v-model:selectedFloorStyle="selectedFloorStyle"
                v-model:selectedUnitType="selectedUnitType"
                :categoryOptions="categoryOptions"
                :supplier-options="supplierOptions"
                :floor-style-options="floorStyleOptions"
                :unit-type-options="catalogs.unitTypes"
                @clear-filters="clearFilters"
            />

            <div
                v-if="filteredProducts.length === 0"
                class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface"
            >
                {{
                    inventory.products.length === 0
                        ? "Aún no hay productos de pisos registrados."
                        : "No se encontraron productos con esos filtros."
                }}
            </div>

            <InventoryTable
                v-else
                :products="filteredProducts"
                :visibleVariantsByProduct="visibleVariantsByProduct"
                :focus-product-id="focusProductId"
                :deleting-product-id="busyId"
                @edit-product="editProduct"
                @delete-product="requestDelete"
                @open-stock-dialog="openStockDialog"
                @open-movements-dialog="openMovementsDialog"
            />
        </template>
    </div>

    <StockAdjustDialog
        v-model:visible="stockDialogOpen"
        :url="stockDialogVariant ? `/api/product-variants/${stockDialogVariant.id}/stock` : null"
        :stock="stockDialogVariant?.stock_boxes"
        :stock-unit="stockDialogUnit.short"
        :quantity-label="`Cantidad (${stockDialogUnit.label})`"
        :subtitle="stockDialogVariant?.color"
        :low-stock="stockDialogVariant?.low_stock ?? false"
        @stock-updated="onVariantStockUpdated"
    />

    <StockMovementsDialog
        v-model:visible="movementsDialogOpen"
        :url="movementsDialogVariant ? `/api/product-variants/${movementsDialogVariant.id}/stock-movements` : null"
        :stock="movementsDialogVariant?.stock_boxes"
        :stock-unit="movementsDialogUnit.short"
        :subtitle="movementsDialogVariant?.color"
    />

    <!-- Sin grupo: el de StockAdjustDialog usa el suyo, así que no se cruzan. -->
    <ConfirmDialog :pt="{ mask: { class: 'bg-primary/50' } }">
        <template #container="{ message, acceptCallback, rejectCallback }">
            <div class="bg-surface border border-border rounded-md p-5 w-[380px] max-w-[90vw]">
                <h3 class="font-serif text-base text-primary mb-2">{{ message.header }}</h3>
                <p class="text-sm text-text-muted mb-5">{{ message.message }}</p>
                <div class="flex items-center justify-end gap-3">
                    <!-- Foco inicial en Cancelar: en una acción que no se puede
					     deshacer, Enter no debe eliminar. -->
                    <button
                        type="button"
                        autofocus
                        @click="rejectCallback"
                        class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        @click="acceptCallback"
                        class="bg-danger hover:bg-danger/90 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-1"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </template>
    </ConfirmDialog>
</template>

<script setup>
import { onMounted, ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ConfirmDialog from "primevue/confirmdialog";
import { useInventoryStore } from "@/stores/inventory";
import { useProductDelete } from "@/composables/useProductDelete";
import { useCatalogsStore } from "@/stores/catalogs";
import { variantStockUnit } from "@/lib/unitTypes";

import InventoryFilters from "./components/InventoryFilters.vue";
import InventoryTable from "./components/InventoryTable.vue";
import StockAdjustDialog from "./components/StockAdjustDialog.vue";
import StockMovementsDialog from "./components/StockMovementsDialog.vue";
import SimpleProductsSection from "./components/SimpleProductsSection.vue";

const route = useRoute();
const router = useRouter();
const inventory = useInventoryStore();
const catalogs = useCatalogsStore();

onMounted(() => {
    if (!inventory.initialized) inventory.fetchProducts();
    if (!catalogs.initialized) catalogs.fetchCatalogs();
});

// La sección activa vive en la URL (?seccion=otros) para que, al volver de
// crear/editar un producto simple, se regrese a "Otros productos" y no a pisos.
const sections = [
    { key: "floors", label: "Catálogo de pisos" },
    { key: "other", label: "Otros productos" },
];

const activeSection = computed(() => (route.query.seccion === "otros" ? "other" : "floors"));

// Un solo botón en el encabezado para ambas secciones; solo cambia el destino.
const newProductRoute = computed(() =>
    activeSection.value === "other"
        ? { name: "inventory.simpleProducts.create" }
        : { name: "products.create" },
);

function selectSection(key) {
    router.replace({ query: key === "other" ? { seccion: "otros" } : floorsFilterQuery() });
}

function editProduct(productId) {
    router.push({ name: "products.edit", params: { id: productId } });
}

// La fila se quita in-place en inventory.deleteProduct(); no hay nada más que hacer.
const { busyId, deleteError, requestDelete } = useProductDelete();

const stockDialogOpen = ref(false);
const stockDialogVariant = ref(null);
// Cajas o piezas según la unidad de venta del producto de la variante.
const stockDialogUnit = ref(variantStockUnit(null));

function openStockDialog(variant, product) {
    stockDialogVariant.value = variant;
    stockDialogUnit.value = variantStockUnit(product.unit_type);
    stockDialogOpen.value = true;
}

function onVariantStockUpdated(updatedVariant) {
    inventory.updateVariantStock(updatedVariant.id, {
        stock_boxes: updatedVariant.stock_boxes,
        low_stock: updatedVariant.low_stock,
    });
}

const movementsDialogOpen = ref(false);
const movementsDialogVariant = ref(null);
const movementsDialogUnit = ref(variantStockUnit(null));

function openMovementsDialog(variant, product) {
    movementsDialogVariant.value = variant;
    movementsDialogUnit.value = variantStockUnit(product.unit_type);
    movementsDialogOpen.value = true;
}

// Filters logic
// La búsqueda vive en la URL (?buscar=…) para que se conserve al volver del form
// de producto. Se lee al montar y se escribe con router.replace; un computed
// sobre route.query perdería letras al teclear rápido.
const searchQuery = ref(typeof route.query.buscar === "string" ? route.query.buscar : "");
const selectedCategory = ref("");
const selectedSupplier = ref("");
const selectedFloorStyle = ref("");
const selectedUnitType = ref("");

// Llegar con ?producto=<id> (fila de Stock bajo del Dashboard) abre ese
// producto ya expandido y lo trae a la vista, para ajustar stock sin buscarlo.
// Solo esa vez: al tocar cualquier filtro se apaga (y sale de la URL), para
// que la tabla no lo vuelva a expandir si se remonta.
const focusProductId = ref(typeof route.query.producto === "string" ? Number(route.query.producto) : null);

function floorsFilterQuery() {
    return {
        ...(searchQuery.value ? { buscar: searchQuery.value } : {}),
        ...(focusProductId.value ? { producto: String(focusProductId.value) } : {}),
    };
}

watch([searchQuery, selectedCategory, selectedSupplier, selectedFloorStyle, selectedUnitType], () => {
    focusProductId.value = null;
    // Solo aplican a Catálogo de pisos; en "Otros productos" la URL es solo la sección.
    if (activeSection.value === "floors") router.replace({ query: floorsFilterQuery() });
});

// Guardar/cancelar en el form de producto regresa al listado con el mismo
// filtro (ej. desde una alerta de stock bajo del Dashboard). Se filtra por
// nombre de ruta: al navegar al form, `route` ya cambió antes de que este
// componente se desmonte, y sin el guard se guardaría el query del form (vacío).
watch(
    () => route.query,
    (query) => {
        if (route.name === "inventory") inventory.listQuery = { ...query };
    },
    { immediate: true },
);

function clearFilters() {
    searchQuery.value = "";
    selectedCategory.value = "";
    selectedSupplier.value = "";
    selectedFloorStyle.value = "";
    selectedUnitType.value = "";
}

const categoryOptions = computed(() => {
    const set = new Set(inventory.products.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
});

// Solo proveedores con pisos registrados: los demás (ej. solo de "Otros
// productos") dejarían la tabla vacía. En el orden del catálogo.
const supplierOptions = computed(() => {
    const ids = new Set(inventory.products.map((p) => p.supplier_id));
    return catalogs.suppliers.filter((supplier) => ids.has(supplier.id));
});

// Mismo criterio que proveedores: solo estilos asignados a algún piso.
const floorStyleOptions = computed(() => {
    const ids = new Set(inventory.products.map((p) => p.floor_style_id));
    return catalogs.floorStyles.filter((floorStyle) => ids.has(floorStyle.id));
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
        if (selectedSupplier.value && product.supplier_id !== selectedSupplier.value) return false;
        if (selectedFloorStyle.value && product.floor_style_id !== selectedFloorStyle.value) return false;
        if (selectedUnitType.value && product.unit_type_id !== selectedUnitType.value) return false;
        const variants = visibleVariantsByProduct.value.get(product.id) ?? [];
        return variants.length > 0;
    });
});
</script>
