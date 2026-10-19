<template>
    <div class="flex flex-wrap items-center gap-3 mb-4">
        <div class="relative flex-1 min-w-56">
            <svg
                class="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <InputTextCustom v-model="searchQuery" :placeholder="searchPlaceholder" class="pl-8" />
        </div>

        <div class="w-full sm:w-56">
            <SelectCustom
                v-model="selectedCategory"
                :options="categoryOptions"
                placeholder="Todas las categorías"
                allow-empty
            />
        </div>

        <!-- Solo en Catálogo de pisos: "Otros productos" no pasa estas opciones. -->
        <div v-if="supplierOptions" class="w-full sm:w-56">
            <SelectCustom
                v-model="selectedSupplier"
                :options="supplierOptions"
                placeholder="Todos los proveedores"
                allow-empty
            />
        </div>

        <div v-if="unitTypeOptions" class="w-full sm:w-44">
            <SelectCustom
                v-model="selectedUnitType"
                :options="unitTypeOptions"
                placeholder="Todas las unidades"
                allow-empty
            />
        </div>

        <!-- Solo en Otros productos: los pisos no tienen precio de mayoreo. -->
        <div v-if="showWholesaleFilter" class="w-full sm:w-56">
            <SelectCustom
                v-model="selectedWholesale"
                :options="WHOLESALE_OPTIONS"
                placeholder="Mayoreo: todos"
                allow-empty
            />
        </div>

        <button
            v-if="hasActiveFilters"
            type="button"
            class="text-xs text-text-muted hover:text-text underline cursor-pointer"
            @click="emit('clear-filters')"
        >
            Limpiar filtros
        </button>
    </div>
</template>

<script setup>
import { computed } from "vue";
import SelectCustom from "@/components/widgets/SelectCustom.vue";
import InputTextCustom from "@/components/widgets/InputTextCustom.vue";

defineProps({
    categoryOptions: {
        type: Array,
        required: true,
    },
    searchPlaceholder: {
        type: String,
        default: "Buscar por línea, color o código…",
    },
    // Catálogos { id, name } (proveedores, unidades de venta). Sin ellos, el
    // selector no se muestra.
    supplierOptions: {
        type: Array,
        default: null,
    },
    unitTypeOptions: {
        type: Array,
        default: null,
    },
    showWholesaleFilter: {
        type: Boolean,
        default: false,
    },
});

// Los selectores no llevan etiqueta visible: cada opción dice a qué se refiere.
const WHOLESALE_OPTIONS = [{ id: "yes", name: "Con mayoreo" }];

const emit = defineEmits(["clear-filters"]);

const searchQuery = defineModel("searchQuery", { type: String, default: "" });
const selectedCategory = defineModel("selectedCategory", { type: String, default: "" });
const selectedSupplier = defineModel("selectedSupplier", { type: [String, Number], default: "" });
const selectedUnitType = defineModel("selectedUnitType", { type: [String, Number], default: "" });
// "" (todos) | "yes"
const selectedWholesale = defineModel("selectedWholesale", { type: String, default: "" });

const hasActiveFilters = computed(
    () =>
        searchQuery.value !== "" ||
        selectedCategory.value !== "" ||
        selectedSupplier.value !== "" ||
        selectedUnitType.value !== "" ||
        selectedWholesale.value !== "",
);
</script>
