<template>
    <Dialog v-model:visible="visible" modal :pt="{ mask: { class: 'bg-primary/50' } }" @hide="reset">
        <template #container="{ closeCallback }">
            <div
                v-if="url"
                class="bg-surface border border-border rounded-md p-4 sm:p-5 w-95 max-w-[90vw]"
            >
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-serif text-base text-primary">
                        {{ isTracked ? "Ajustar stock" : "Activar seguimiento de stock" }}
                    </h3>
                    <button
                        type="button"
                        @click="closeCallback"
                        class="text-text-muted hover:text-text transition-colors cursor-pointer"
                        aria-label="Cerrar"
                    >
                        <i class="ti ti-x text-base"></i>
                    </button>
                </div>

                <!-- Nombre arriba; el estado en su propia línea, con el mismo badge
				     que la columna Estado del catálogo. -->
                <div class="text-sm text-text mb-4">
                    <p v-if="subtitle" class="mb-1.5">{{ subtitle }}</p>
                    <div class="flex flex-wrap items-center gap-2">
                        <StockStatusBadge
                            v-if="!isTracked || lowStock !== null"
                            :tracked="isTracked"
                            :low-stock="!!lowStock"
                        />
                        <span v-if="isTracked">
                            Stock actual: <span class="font-medium">{{ stock }} {{ stockUnit }}</span>
                        </span>
                    </div>
                    <span v-if="!isTracked" class="block text-xs text-text-muted mt-1.5">
                        La cantidad que ingreses será el stock inicial; a partir de ahí se podrá
                        agregar o quitar.
                    </span>
                </div>

                <!-- Sin tracking solo se permite `add`: el backend rechaza `subtract` (422). -->
                <div v-if="isTracked" class="flex gap-2 mb-4">
                    <button
                        type="button"
                        @click="stockAdjustType = 'add'"
                        class="flex-1 h-10 rounded-md text-sm font-medium border transition-colors"
                        :class="
                            stockAdjustType === 'add'
                                ? 'bg-success/10 border-success text-success'
                                : 'border-border text-text-muted hover:text-text'
                        "
                    >
                        Agregar
                    </button>
                    <button
                        type="button"
                        @click="stockAdjustType = 'subtract'"
                        class="flex-1 h-10 rounded-md text-sm font-medium border transition-colors"
                        :class="
                            stockAdjustType === 'subtract'
                                ? 'bg-danger/10 border-danger text-danger'
                                : 'border-border text-text-muted hover:text-text'
                        "
                    >
                        Quitar
                    </button>
                </div>

                <!-- Acción secundaria (link, no botón primario): pide confirmación aparte. -->
                <div v-if="isTracked" class="-mt-2 mb-4 text-right">
                    <button
                        type="button"
                        @click="confirmDeactivate"
                        :disabled="stockAdjustSubmitting"
                        class="text-xs text-text-muted hover:text-danger underline underline-offset-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                        Desactivar seguimiento de stock
                    </button>
                </div>

                <div class="space-y-1.5 mb-4">
                    <FieldLabel html-for="stock_adjust_quantity" :text="quantityLabel" required />
                    <InputNumberCustom
                        id="stock_adjust_quantity"
                        v-model="stockAdjustQuantity"
                        :min="minQuantity"
                        placeholder="0"
                        :max-fraction-digits="0"
                    />
                </div>

                <p v-if="stockDialogError" class="text-danger text-[12px] mb-4">
                    {{ stockDialogError }}
                </p>

                <div class="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        @click="closeCallback"
                        class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        @click="submitStockAdjust"
                        :disabled="!isStockAdjustValid || stockAdjustSubmitting"
                        class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                    >
                        {{ stockAdjustSubmitting ? "Aplicando…" : "Aplicar" }}
                    </button>
                </div>
            </div>
        </template>
    </Dialog>

    <!-- `group` propio por instancia: en Inventario hay dos StockAdjustDialog montados
	     a la vez (variantes y otros productos) y un ConfirmDialog sin grupo
	     responde a cualquier confirm.require() de la página. -->
    <ConfirmDialog :group="confirmGroup" :pt="{ mask: { class: 'bg-primary/50' } }">
        <template #container="{ message, acceptCallback, rejectCallback }">
            <div class="bg-surface border border-border rounded-md p-5 w-[380px] max-w-[90vw]">
                <h3 class="font-serif text-base text-primary mb-2">{{ message.header }}</h3>
                <p class="text-sm text-text-muted mb-5">{{ message.message }}</p>
                <div class="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        @click="rejectCallback"
                        class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                    >
                        Volver
                    </button>
                    <button
                        type="button"
                        @click="acceptCallback"
                        class="bg-danger hover:bg-danger/90 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                    >
                        Desactivar
                    </button>
                </div>
            </div>
        </template>
    </ConfirmDialog>
</template>

<script setup>
import { ref, computed, useId } from "vue";
import Dialog from "primevue/dialog";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import axios from "@/lib/axios";
import InputNumberCustom from "@/components/widgets/InputNumberCustom.vue";
import FieldLabel from "@/components/widgets/labels/FieldLabel.vue";
import StockStatusBadge from "./StockStatusBadge.vue";

// No sabe de qué tipo de producto es el stock (variante, producto simple): recibe
// el endpoint PATCH y lo que debe mostrar, y emite la respuesta del backend para
// que el padre actualice su store in-place.
const props = defineProps({
    // Endpoint PATCH de stock (ej. `/api/product-variants/5/stock`). Sin él no se muestra nada.
    url: { type: String, default: null },
    // null = el producto no lleva control de stock (solo admite `add`).
    stock: { type: Number, default: null },
    stockUnit: { type: String, default: "" },
    quantityLabel: { type: String, default: "Cantidad" },
    // Contexto opcional arriba del estado (ej. el color de la variante).
    subtitle: { type: String, default: "" },
    // `low_stock` de la variante. null = sin stock mínimo (productos simples):
    // con stock controlado no lleva badge, igual que en su tabla.
    lowStock: { type: Boolean, default: null },
});

const visible = defineModel("visible", { type: Boolean, default: false });
const emit = defineEmits(["stock-updated"]);

const stockAdjustType = ref("add");
const stockAdjustQuantity = ref(null);
const stockDialogError = ref(null);
const stockAdjustSubmitting = ref(false);

const confirm = useConfirm();
const confirmGroup = `stock-deactivate-${useId()}`;

const isTracked = computed(() => props.stock !== null && props.stock !== undefined);

// Activar seguimiento admite 0 ("empezar a trackear desde cero"); un ajuste
// sobre stock ya controlado necesita al menos 1.
const minQuantity = computed(() => (isTracked.value ? 1 : 0));

const isStockAdjustValid = computed(
    () =>
        Number.isInteger(stockAdjustQuantity.value) &&
        stockAdjustQuantity.value >= minQuantity.value,
);

function reset() {
    stockAdjustType.value = "add";
    stockAdjustQuantity.value = null;
    stockDialogError.value = null;
}

// Ajuste y desactivación comparten endpoint y respuesta: el padre actualiza su
// store con lo que devuelva el PATCH (stock nuevo, o null al desactivar).
async function patchStock(payload, fallbackError) {
    stockAdjustSubmitting.value = true;
    stockDialogError.value = null;

    try {
        const { data } = await axios.patch(props.url, payload);

        emit("stock-updated", data.data);
        visible.value = false;
    } catch (err) {
        stockDialogError.value = err.response?.data?.message || fallbackError;
    } finally {
        stockAdjustSubmitting.value = false;
    }
}

function submitStockAdjust() {
    if (!isStockAdjustValid.value || !props.url) return;

    patchStock(
        {
            quantity: stockAdjustQuantity.value,
            type: isTracked.value ? stockAdjustType.value : "add",
        },
        "No se pudo ajustar el stock. Intenta de nuevo.",
    );
}

function confirmDeactivate() {
    confirm.require({
        group: confirmGroup,
        header: "Desactivar seguimiento de stock",
        message: `Esto quitará el seguimiento de stock de este producto (actualmente ${props.stock} ${props.stockUnit}). Podrás volver a activarlo después. ¿Continuar?`,
        // Sin quantity: el backend retira todo el stock actual.
        accept: () =>
            patchStock(
                { type: "deactivate" },
                "No se pudo desactivar el seguimiento. Intenta de nuevo.",
            ),
    });
}
</script>
