<template>
    <div class="p-2 max-w-4xl">
        <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
                <h1 class="font-serif text-xl text-primary">{{ route.meta.title }}</h1>
                <p class="text-sm text-text-muted mt-0.5">
                    {{
                        isEditMode
                            ? "Modifica los datos de la línea, sus medidas, precios y colores. El stock se ajusta desde Inventario."
                            : "Registra una línea de piso con sus medidas, precios y colores. Puedes agregar más medidas y colores después."
                    }}
                </p>
            </div>
            <button
                type="button"
                @click="handleCancel"
                class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer inline-flex items-center gap-1.5 shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
                <i class="ti ti-arrow-left text-sm"></i>
                Volver
            </button>
        </div>

        <p
            v-if="generalError"
            class="text-danger text-[13px] mb-4 flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2"
        >
            <svg
                class="w-3.5 h-3.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
            </svg>
            {{ generalError }}
        </p>

        <form
            ref="formRef"
            @submit.prevent="handleSubmit"
            @keydown.capture="advanceSelectOnEnter"
            @keydown="advanceOnEnter"
            class="space-y-4"
        >
            <!-- Sección 1 — Datos del producto (línea) -->
            <ProductInfoSection
                v-model:form="form"
                v-model:errors="errors"
                :has-saved-variants="hasSavedVariants"
            />

            <!-- Sección 2 — Un panel por medida: su ficha técnica + sus colores. Una
			     sola abierta a la vez para no perder de vista qué medida se edita. -->
            <Accordion v-model:value="openGroupId" class="variant-groups">
                <VariantGroupCard
                    v-for="(group, index) in variantGroups"
                    :key="group.id"
                    v-model:group="variantGroups[index]"
                    :index="index"
                    :sold-by-piece="soldByPiece"
                    :stock-unit="stockUnit"
                    :removable="canRemoveGroup(group)"
                    :removal-hint="needsSavedColorsRemoved(group)"
                    :deleting-row-id="deletingRowId"
                    :delete-error="deleteError"
                    @remove="removeVariantGroup(group.id)"
                    @remove-color="(row) => removeColorRow(group, row.id)"
                />
            </Accordion>

            <button
                type="button"
                @click="addVariantGroup"
                class="w-full border border-dashed border-border rounded-md py-3 text-sm text-text-muted hover:text-text hover:border-accent bg-surface transition-colors select-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
                + Agregar medida
            </button>

            <!-- Acciones -->
            <div class="flex items-center justify-end gap-3">
                <SaveShortcutHint :modifier-label="modifierLabel" class="mr-auto" />
                <button
                    type="button"
                    @click="handleCancel"
                    class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    :aria-keyshortcuts="ariaKeyshortcuts"
                    :disabled="submitting || loadingProduct"
                    class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-1"
                >
                    {{
                        submitting
                            ? "Guardando…"
                            : isEditMode
                                ? "Guardar cambios"
                                : "Guardar producto"
                    }}
                </button>
            </div>
        </form>

        <StockChangesConfirmDialog />

        <ConfirmDialog :pt="{ mask: { class: 'bg-primary/50' } }">
            <template #container="{ message, acceptCallback, rejectCallback }">
                <div class="bg-surface border border-border rounded-md p-5 w-[380px] max-w-[90vw]">
                    <h3 class="font-serif text-base text-primary mb-2">{{ message.header }}</h3>
                    <p class="text-sm text-text-muted mb-5 whitespace-pre-line">{{ message.message }}</p>
                    <div class="flex items-center justify-end gap-3">
                        <!-- Foco inicial en Cancelar (ver StockChangesConfirmDialog): en una
						     acción que no se puede deshacer, Enter no debe eliminar. -->
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
    </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Accordion from "primevue/accordion";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import axios from "@/lib/axios";
import { useCatalogsStore } from "@/stores/catalogs";
import { useInventoryStore } from "@/stores/inventory";
import { confirmStockChanges } from "@/lib/stockChange";
import { advanceOnEnter, advanceSelectOnEnter, focusFirstInvalidField } from "@/lib/formKeyboard";
import SaveShortcutHint from "@/components/widgets/labels/SaveShortcutHint.vue";
import { useSaveShortcut } from "@/composables/useSaveShortcut";
import { isSoldByPiece, variantStockUnit } from "@/lib/unitTypes";
import {
    buildVariantPayload,
    createVariantGroup,
    groupHasErrors,
    pendingStockChanges,
    validateVariantGroups,
    variantGroupsFromProduct,
} from "@/lib/productForm";
import StockChangesConfirmDialog from "./components/StockChangesConfirmDialog.vue";
import ProductInfoSection from "./components/ProductInfoSection.vue";
import VariantGroupCard from "./components/VariantGroupCard.vue";

// Coordina el form de producto de pisos: carga, validación y guardado. Cada
// sección vive en su componente (ProductInfoSection, VariantGroupCard →
// VariantColorsTable) y las reglas puras en lib/productForm.js.

const route = useRoute();
const router = useRouter();
const confirm = useConfirm();
const catalogs = useCatalogsStore();
const inventory = useInventoryStore();

const isEditMode = computed(() => !!route.params.id);
const loadingProduct = ref(false);

const formRef = ref(null);

// Sin mouse: en un alta se puede empezar a capturar sin hacer clic. El Select
// pone su `labelId` en el elemento enfocable (ver SelectCustom.vue).
onMounted(() => {
    if (!catalogs.initialized) catalogs.fetchCatalogs();
    if (isEditMode.value) fetchProduct();
    else document.getElementById("supplier_id")?.focus();
});

// Tras agregar o quitar algo el foco no se pierde en el <body>: va al campo con
// el que se sigue capturando.
async function focusField(id) {
    await nextTick();
    document.getElementById(id)?.focus();
}

const form = reactive({
    supplier_id: "",
    floor_style_id: "",
    category_id: "",
    unit_type_id: "",
    name: "",
    purchase_unit: "",
});

const errors = reactive({
    supplier_id: "",
    floor_style_id: "",
    category_id: "",
    unit_type_id: "",
    name: "",
    purchase_unit: "",
});

// Se recalcula al cambiar el selector de Unidad, en creación y en edición.
const selectedUnitTypeName = computed(
    () => catalogs.unitTypes.find((unitType) => unitType.id === form.unit_type_id)?.name ?? null,
);
const soldByPiece = computed(() => isSoldByPiece(selectedUnitTypeName.value));
const stockUnit = computed(() => variantStockUnit(selectedUnitTypeName.value));

const variantGroups = ref([createVariantGroup()]);

// Medida abierta en el acordeón (su `id`); null si el usuario las colapsó todas.
const openGroupId = ref(variantGroups.value[0].id);

// Solo en edición hay filas con `variantId`. Con variantes guardadas la Unidad
// no se puede cambiar (el backend lo rechaza), así que el selector se bloquea.
const hasSavedVariants = computed(() =>
    variantGroups.value.some((group) => group.colorRows.some((row) => row.variantId)),
);

function addVariantGroup() {
    const group = createVariantGroup();
    variantGroups.value.push(group);
    openGroupId.value = group.id;
    focusField(`size-${group.id}`);
}

// Mismo criterio que colores nuevos vs. existentes: un grupo solo se quita si
// ninguna de sus filas existe ya como variante en backend. Siempre queda al menos uno.
function canRemoveGroup(group) {
    return variantGroups.value.length > 1 && group.colorRows.every((row) => !row.variantId);
}

// Lo único que impide quitarla son sus colores guardados (con una sola medida no
// hay nada que explicar: el producto siempre conserva al menos una).
function needsSavedColorsRemoved(group) {
    return variantGroups.value.length > 1 && group.colorRows.some((row) => row.variantId);
}

function removeVariantGroup(groupId) {
    const group = variantGroups.value.find((g) => g.id === groupId);
    if (!group || !canRemoveGroup(group)) return;
    const index = variantGroups.value.indexOf(group);
    variantGroups.value = variantGroups.value.filter((g) => g.id !== groupId);
    const next = variantGroups.value[Math.max(index - 1, 0)];
    openGroupId.value = next.id;
    focusField(`size-${next.id}`);
}

// El foco pasa al color de la fila que quedó en su lugar (o a la anterior si
// era la última).
function removeRowAndFocus(group, rowId) {
    const index = group.colorRows.findIndex((r) => r.id === rowId);
    group.colorRows = group.colorRows.filter((r) => r.id !== rowId);
    const next = group.colorRows[Math.min(index, group.colorRows.length - 1)];
    focusField(`color-${next.id}`);
}

const deletingRowId = ref(null);
// { rowId, message } del último DELETE rechazado con 422; se muestra bajo esa fila.
const deleteError = ref(null);

// Filas sin `variantId` son nuevas en esta sesión (o el flujo de creación, donde
// ninguna fila lo tiene) — se quitan del array local sin tocar el backend. Filas con
// `variantId` ya existen como variante real, así que requieren confirmación y un
// DELETE inmediato (no esperan al submit del form). El mínimo de 1 color aplica por
// grupo: quitar el último color de una medida no se permite desde aquí.
function removeColorRow(group, rowId) {
    if (group.colorRows.length === 1) return;

    const row = group.colorRows.find((r) => r.id === rowId);
    if (!row) return;

    if (!row.variantId) {
        removeRowAndFocus(group, rowId);
        return;
    }

    confirm.require({
        header: "Eliminar variante",
        message: `¿Eliminar el color "${row.color}"? Esta acción no se puede deshacer.\nEste color se eliminará de inmediato, aunque no hayas guardado los demás cambios del formulario.`,
        accept: () => deleteVariantRow(group, row),
    });
}

async function deleteVariantRow(group, row) {
    deletingRowId.value = row.id;
    generalError.value = null;
    deleteError.value = null;

    try {
        await axios.delete(`/api/product-variants/${row.variantId}`);
        removeRowAndFocus(group, row.id);
    } catch (err) {
        // 422 de negocio sin `errors` (ej. última variante del producto): corresponde
        // a la fila que se intentó eliminar, así que va bajo ella, no al error general.
        if (err.response?.status === 422) {
            deleteError.value = {
                rowId: row.id,
                message: err.response.data.message || "No se pudo eliminar este color.",
            };
        } else {
            generalError.value = "No se pudo eliminar la variante. Intenta de nuevo.";
        }
    } finally {
        deletingRowId.value = null;
    }
}

function populateFormFromProduct(product) {
    form.supplier_id = product.supplier_id;
    form.floor_style_id = product.floor_style_id ?? "";
    form.category_id = product.category_id;
    form.unit_type_id = product.unit_type_id;
    form.name = product.name;
    form.purchase_unit = product.purchase_unit;

    const groups = variantGroupsFromProduct(product);
    if (groups.length) variantGroups.value = groups;
    openGroupId.value = variantGroups.value[0].id;
}

async function fetchProduct() {
    loadingProduct.value = true;

    try {
        const { data } = await axios.get(`/api/products/${route.params.id}`, {
            params: { with: "variants" },
        });
        populateFormFromProduct(data.data);
    } catch (err) {
        console.error(err);
        generalError.value = "No se pudo cargar el producto.";
    } finally {
        loadingProduct.value = false;
    }
}

const requiredFormFields = ["supplier_id", "category_id", "unit_type_id", "name", "purchase_unit"];

const validateForm = () => {
    let isValid = true;

    for (const field of requiredFormFields) {
        errors[field] = "";
        if (form[field] === "" || form[field] === null) {
            errors[field] = "Este campo es requerido";
            isValid = false;
        }
    }

    // Sin cortocircuito: siempre se marcan también los errores de las medidas.
    const groupsValid = validateVariantGroups(variantGroups.value, soldByPiece.value);

    return isValid && groupsValid;
};

const submitting = ref(false);
const generalError = ref(null);

const { modifierLabel, ariaKeyshortcuts } = useSaveShortcut(formRef, () => !submitting.value && !loadingProduct.value);

// Solo mapea a `errors` los campos del producto — es lo único validado antes
// de que exista un `productId`, momento en el que aplican los 422.
// Devuelve si aplicó alguno. Los guards del backend (ej. el bloqueo de cambio
// de unidad) responden 422 solo con `message`, sin `errors`.
function applyServerErrors(serverErrors = {}) {
    let applied = false;
    for (const field of Object.keys(serverErrors)) {
        if (field in errors) {
            errors[field] = serverErrors[field][0];
            applied = true;
        }
    }
    return applied;
}

// Corre después de guardar las variantes. Cada ajuste es independiente: los que
// salen bien actualizan `originalStock` para que un reintento no los repita.
// Devuelve los que fallaron (ej. "Stock insuficiente" si hubo una venta mientras
// el form estaba abierto).
async function applyStockChanges(changes) {
    const results = await Promise.allSettled(
        changes.map(({ row, payload }) =>
            axios.patch(`/api/product-variants/${row.variantId}/stock`, payload),
        ),
    );

    return results.flatMap((result, index) => {
        const { row, label } = changes[index];
        if (result.status === "fulfilled") {
            row.stock_boxes = result.value.data.data.stock_boxes;
            row.originalStock = row.stock_boxes;
            return [];
        }
        return [`${label} (${result.reason.response?.data?.message ?? "error inesperado"})`];
    });
}

const handleSubmit = async () => {
    if (!validateForm()) {
        // Un campo dentro de una medida colapsada no se puede enfocar: se abre la
        // primera medida con errores (las anteriores no tienen ninguno).
        const invalidGroup = variantGroups.value.find(groupHasErrors);
        if (invalidGroup) openGroupId.value = invalidGroup.id;
        focusFirstInvalidField(formRef.value);
        return;
    }

    const stockChanges = pendingStockChanges(variantGroups.value, stockUnit.value.short);
    if (stockChanges.length) {
        // Al regresar sin guardar, el foco vuelve a donde estaba (el diálogo lo tomó).
        const returnFocus = document.activeElement;
        if (!(await confirmStockChanges(confirm, stockChanges))) {
            await nextTick();
            returnFocus?.focus();
            return;
        }
    }

    generalError.value = null;
    deleteError.value = null;
    submitting.value = true;
    let productId = isEditMode.value ? route.params.id : null;
    let productSaved = false;

    try {
        const productPayload = {
            supplier_id: form.supplier_id,
            // Opcional: "" (Sin estilo) se manda como null para quitarlo en edición.
            floor_style_id: form.floor_style_id || null,
            category_id: form.category_id,
            unit_type_id: form.unit_type_id,
            name: form.name,
            purchase_unit: form.purchase_unit,
        };

        if (isEditMode.value) {
            await axios.put(`/api/products/${productId}`, productPayload);
        } else {
            const { data } = await axios.post("/api/products", productPayload);
            productId = data.data.id;
        }
        productSaved = true;

        // Filas sin `variantId` son nuevas en esta sesión de edición (o el flujo de
        // creación, donde ninguna fila lo tiene). No se borra ninguna variante aquí
        // aunque el usuario haya quitado una fila del form — eso es el paso 5.5.
        await Promise.all(
            variantGroups.value.flatMap((group) =>
                group.colorRows.map((row) => {
                    const payload = buildVariantPayload(productId, group, row, soldByPiece.value);
                    return row.variantId
                        ? axios.put(`/api/product-variants/${row.variantId}`, payload)
                        : axios.post("/api/product-variants", payload);
                }),
            ),
        );

        const stockFailures = await applyStockChanges(stockChanges);

        await inventory.fetchProducts();

        if (stockFailures.length) {
            generalError.value = `Se guardaron los cambios, pero no se pudo ajustar el stock de: ${stockFailures.join("; ")}.`;
            return;
        }

        router.push({ name: "inventory", query: inventory.listQuery });
    } catch (err) {
        if (productSaved) {
            console.error(err);
            generalError.value = isEditMode.value
                ? "El producto se actualizó correctamente, pero ocurrió un error al guardar una o más variantes. Revísalo desde el inventario."
                : "El producto se creó correctamente, pero ocurrió un error al guardar una o más variantes. Revísalo desde el inventario.";
        } else if (err.response?.status === 422) {
            // Mismo criterio que CategoryFormDialog/SupplierFormDialog: sin error
            // de campo aplicable, el mensaje va como error general.
            if (applyServerErrors(err.response.data.errors ?? {})) {
                focusFirstInvalidField(formRef.value);
            } else {
                generalError.value = err.response.data.message || "No se pudo guardar el producto.";
            }
        } else {
            generalError.value =
                err.response?.data?.message || "No se pudo guardar el producto. Intenta de nuevo.";
        }
    } finally {
        submitting.value = false;
    }
};

function handleCancel() {
    router.push({ name: "inventory", query: inventory.listQuery });
}
</script>

<style scoped>
/* Accordion unstyled: cada panel se ve como las demás tarjetas del form. */
.variant-groups {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}
.variant-groups :deep([data-pc-name="accordionpanel"]) {
	background: var(--color-surface);
	border: 1px solid var(--color-border);
	border-radius: 0.375rem;
}
/* Abierta: una línea sutil separa el encabezado de la ficha. */
.variant-groups :deep([data-pc-name="accordioncontent"]) {
	border-top: 1px solid var(--color-border);
	padding-top: 1.25rem;
}
</style>
