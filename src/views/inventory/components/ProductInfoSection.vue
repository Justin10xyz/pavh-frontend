<template>
    <div class="bg-surface border border-border rounded-md p-5 sm:p-6">
        <h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">
            Datos del producto (línea)
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
                <FieldLabel html-for="supplier_id" text="Proveedor" required />
                <!-- Igual que Categoría: crear el proveedor aquí evita salir del
				     formulario. Solo con el catálogo cargado (ver SuppliersSettingsView). -->
                <div class="flex gap-2">
                    <div class="flex-1 min-w-0">
                        <SelectCustom
                            id="supplier_id"
                            v-model="form.supplier_id"
                            :options="catalogs.suppliers"
                            :loading="catalogs.loading"
                            :error="errors.supplier_id"
                            placeholder="Selecciona un proveedor"
                            @change="errors.supplier_id = ''"
                        />
                    </div>
                    <button
                        type="button"
                        class="shrink-0 inline-flex items-center justify-center h-10 w-10 bg-surface border border-border hover:bg-bg text-text-muted hover:text-text rounded-md transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        aria-label="Nuevo proveedor"
                        title="Nuevo proveedor"
                        :disabled="!catalogs.initialized"
                        @click="supplierDialogVisible = true"
                    >
                        <i class="ti ti-plus text-base" aria-hidden="true"></i>
                    </button>
                </div>
                <p v-if="errors.supplier_id" class="text-danger text-[12px] mt-1.5">
                    {{ errors.supplier_id }}
                </p>
            </div>

            <div class="space-y-1.5">
                <FieldLabel html-for="category_id" text="Categoría" required />
                <!-- Crear la categoría aquí evita salir del formulario y perder lo
				     capturado. Solo con el catálogo cargado (ver CategoriesSettingsView). -->
                <div class="flex gap-2">
                    <div class="flex-1 min-w-0">
                        <SelectCustom
                            id="category_id"
                            v-model="form.category_id"
                            :options="variantCategories"
                            :loading="catalogs.loading"
                            :error="errors.category_id"
                            placeholder="Selecciona una categoría"
                            empty-message="No hay categorías de tipo Pisos"
                            @change="errors.category_id = ''"
                        />
                    </div>
                    <button
                        type="button"
                        class="shrink-0 inline-flex items-center justify-center h-10 w-10 bg-surface border border-border hover:bg-bg text-text-muted hover:text-text rounded-md transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        aria-label="Nueva categoría"
                        title="Nueva categoría"
                        :disabled="!catalogs.initialized"
                        @click="categoryDialogVisible = true"
                    >
                        <i class="ti ti-plus text-base" aria-hidden="true"></i>
                    </button>
                </div>
                <p v-if="errors.category_id" class="text-danger text-[12px] mt-1.5">
                    {{ errors.category_id }}
                </p>
            </div>

            <div class="space-y-1.5">
                <FieldLabel html-for="name" text="Nombre" required />
                <InputTextCustom
                    id="name"
                    v-model="form.name"
                    :error="errors.name"
                    placeholder="Ej. Porcelanato Carrara"
                    @input="errors.name = ''"
                />
                <p v-if="errors.name" class="text-danger text-[12px] mt-1.5">
                    {{ errors.name }}
                </p>
            </div>

            <div class="space-y-1.5">
                <FieldLabel html-for="unit_type_id" text="Unidad" required />
                <SelectCustom
                    id="unit_type_id"
                    v-model="form.unit_type_id"
                    :options="catalogs.unitTypes"
                    :loading="catalogs.loading"
                    :disabled="hasSavedVariants"
                    :error="errors.unit_type_id"
                    placeholder="Selecciona una unidad"
                    @change="errors.unit_type_id = ''"
                />
                <p v-if="errors.unit_type_id" class="text-danger text-[12px] mt-1.5">
                    {{ errors.unit_type_id }}
                </p>
                <!-- Mismo bloqueo que el backend (Product::unitTypeChangeBlockedMessage). -->
                <p v-else-if="hasSavedVariants" class="text-xs text-text-muted mt-1.5">
                    No se puede cambiar si el producto ya tiene variantes registradas.
                </p>
            </div>

            <div class="space-y-1.5">
                <FieldLabel html-for="purchase_unit" text="Unidad de compra" required />
                <InputTextCustom
                    id="purchase_unit"
                    v-model="form.purchase_unit"
                    :error="errors.purchase_unit"
                    placeholder="Ej. Caja"
                    @input="errors.purchase_unit = ''"
                />
                <p v-if="errors.purchase_unit" class="text-danger text-[12px] mt-1.5">
                    {{ errors.purchase_unit }}
                </p>
            </div>
        </div>

        <SupplierFormDialog
            v-model:visible="supplierDialogVisible"
            from-product-form
            @saved="onSupplierCreated"
        />

        <CategoryFormDialog
            v-model:visible="categoryDialogVisible"
            fixed-product-form-type="variant"
            @saved="onCategoryCreated"
        />
    </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useCatalogsStore } from "@/stores/catalogs";
import SelectCustom from "@/components/widgets/SelectCustom.vue";
import InputTextCustom from "@/components/widgets/InputTextCustom.vue";
import FieldLabel from "@/components/widgets/labels/FieldLabel.vue";
import CategoryFormDialog from "@/components/widgets/dialogs/CategoryFormDialog.vue";
import SupplierFormDialog from "@/components/widgets/dialogs/SupplierFormDialog.vue";

// Sección "Datos del producto" de ProductFormView. `form` y `errors` son los
// objetos reactivos de la vista: los campos se editan sobre ellos directamente.
const form = defineModel("form", { type: Object, required: true });
const errors = defineModel("errors", { type: Object, required: true });

defineProps({
    // Con variantes guardadas la Unidad no se puede cambiar (el backend lo rechaza).
    hasSavedVariants: { type: Boolean, default: false },
});

const catalogs = useCatalogsStore();

// Las categorías de tipo 'simple' son de "Otros productos"; aquí solo las de pisos.
const variantCategories = computed(() =>
    catalogs.categories.filter((c) => c.product_form_type === "variant"),
);

const supplierDialogVisible = ref(false);

// El proveedor recién creado queda seleccionado: es para lo que se abrió el diálogo.
function onSupplierCreated(supplier) {
    form.value.supplier_id = supplier.id;
    errors.value.supplier_id = "";
}

const categoryDialogVisible = ref(false);

// La categoría recién creada queda seleccionada: es para lo que se abrió el diálogo.
function onCategoryCreated(category) {
    form.value.category_id = category.id;
    errors.value.category_id = "";
}
</script>

<style scoped></style>
