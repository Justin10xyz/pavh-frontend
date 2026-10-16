<template>
    <div class="bg-surface border border-border rounded-md p-5 sm:p-6">
        <div class="flex items-center justify-between gap-3 mb-4">
            <!-- Mismo criterio que el encabezado de cada medida en InventoryTable.vue:
			     la medida sola no basta (puede repetirse con otro PEI/ETT/precio). -->
            <h2 class="flex flex-wrap items-center gap-2 text-sm">
                <span class="font-medium text-text">
                    {{ group.spec.size || `Medida nueva ${index + 1}` }}
                </span>
                <span
                    v-if="group.spec.pei"
                    class="text-xs text-text-muted border border-border rounded px-1.5 py-0.5"
                >PEI {{ group.spec.pei }}</span
                >
                <span
                    v-if="group.spec.ett"
                    class="text-xs text-text-muted border border-border rounded px-1.5 py-0.5"
                >ETT {{ group.spec.ett }}</span
                >
                <span
                    v-if="group.spec.price_per_box !== null && group.spec.price_per_box !== ''"
                    class="font-semibold text-primary tabular-nums"
                >{{ formatCurrency(group.spec.price_per_box) }}/{{ soldByPiece ? "pieza" : "caja" }}</span
                >
                <span class="text-xs text-text-muted">
                    · {{ group.colorRows.length }}
                    {{ group.colorRows.length === 1 ? "color" : "colores" }}
                </span>
            </h2>
            <!-- Solo medidas sin variantes guardadas: quitar una guardada sería
			     borrar variantes, fuera del alcance de este form. -->
            <button
                v-if="removable"
                type="button"
                @click="emit('remove')"
                class="text-xs text-text-muted hover:text-danger underline transition-colors cursor-pointer"
            >
                Quitar medida
            </button>
        </div>

        <!-- Grupo 1 — Medida y especificaciones técnicas. PEI/ETT no aplican
		     a pisos por pieza (el backend los rechaza). -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="space-y-1.5">
                <FieldLabel :html-for="`size-${group.id}`" text="Medida" required />
                <InputTextCustom
                    :id="`size-${group.id}`"
                    v-model="group.spec.size"
                    :error="group.specErrors.size"
                    placeholder="Ej. 60X120"
                    @input="group.specErrors.size = ''"
                />
                <p v-if="group.specErrors.size" class="text-danger text-[12px] mt-1.5">
                    {{ group.specErrors.size }}
                </p>
            </div>

            <div v-if="!soldByPiece" class="space-y-1.5">
                <FieldLabel :html-for="`pei-${group.id}`" text="PEI" />
                <SelectCustom
                    :id="`pei-${group.id}`"
                    v-model="group.spec.pei"
                    :options="PEI_OPTIONS"
                    keep-unknown-value
                    :error="group.specErrors.pei"
                    placeholder="Selecciona un PEI"
                    @change="group.specErrors.pei = ''"
                />
                <p v-if="group.specErrors.pei" class="text-danger text-[12px] mt-1.5">
                    {{ group.specErrors.pei }}
                </p>
            </div>

            <div v-if="!soldByPiece" class="space-y-1.5">
                <FieldLabel :html-for="`ett-${group.id}`" text="ETT" />
                <InputTextCustom
                    :id="`ett-${group.id}`"
                    v-model="group.spec.ett"
                    :error="group.specErrors.ett"
                    placeholder="Ej. 1"
                    @input="group.specErrors.ett = ''"
                />
                <p v-if="group.specErrors.ett" class="text-danger text-[12px] mt-1.5">
                    {{ group.specErrors.ett }}
                </p>
            </div>
        </div>

        <!-- Grupo 3 — Precio. Pisos por pieza: un solo precio, el de la pieza,
		     que viaja como price_per_box (no llevan precio por m²). -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 border-t border-border pt-4">
            <div class="space-y-1.5">
                <FieldLabel
                    :html-for="`price_per_box-${group.id}`"
                    :text="soldByPiece ? 'Precio por pieza' : 'Precio por caja'"
                    required
                />
                <InputNumberCustom
                    :id="`price_per_box-${group.id}`"
                    v-model="group.spec.price_per_box"
                    :error="group.specErrors.price_per_box"
                    :min="0"
                    placeholder="$0.00"
                    @input="group.specErrors.price_per_box = ''"
                    mode="currency"
                    currency="MXN"
                />
                <p v-if="group.specErrors.price_per_box" class="text-danger text-[12px] mt-1.5">
                    {{ group.specErrors.price_per_box }}
                </p>
            </div>

            <div v-if="!soldByPiece" class="space-y-1.5">
                <FieldLabel :html-for="`price_per_m2-${group.id}`" text="Precio por m²" required />
                <InputNumberCustom
                    :id="`price_per_m2-${group.id}`"
                    v-model="group.spec.price_per_m2"
                    :error="group.specErrors.price_per_m2"
                    :min="0"
                    placeholder="$0.00"
                    @input="group.specErrors.price_per_m2 = ''"
                    mode="currency"
                    currency="MXN"
                />
                <p v-if="group.specErrors.price_per_m2" class="text-danger text-[12px] mt-1.5">
                    {{ group.specErrors.price_per_m2 }}
                </p>
            </div>
        </div>

        <!-- Grupo 2 — Datos por caja. No aplica a pisos por pieza: piezas, m²,
		     kilos y cajas por tarima son empaque/logística de caja. -->
        <div v-if="!soldByPiece" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div class="space-y-1.5">
                <FieldLabel :html-for="`pieces_per_box-${group.id}`" text="Piezas por caja" required />
                <InputNumberCustom
                    :id="`pieces_per_box-${group.id}`"
                    v-model="group.spec.pieces_per_box"
                    :error="group.specErrors.pieces_per_box"
                    :min="0"
                    placeholder="0"
                    @input="group.specErrors.pieces_per_box = ''"
                    :max-fraction-digits="0"
                />
                <p v-if="group.specErrors.pieces_per_box" class="text-danger text-[12px] mt-1.5">
                    {{ group.specErrors.pieces_per_box }}
                </p>
            </div>

            <div class="space-y-1.5">
                <FieldLabel :html-for="`kilos_per_box-${group.id}`" text="Kilos por caja" />
                <InputNumberCustom
                    :id="`kilos_per_box-${group.id}`"
                    v-model="group.spec.kilos_per_box"
                    :error="group.specErrors.kilos_per_box"
                    :min="0"
                    placeholder="0.00"
                    @input="group.specErrors.kilos_per_box = ''"
                    :max-fraction-digits="2"
                />
                <p v-if="group.specErrors.kilos_per_box" class="text-danger text-[12px] mt-1.5">
                    {{ group.specErrors.kilos_per_box }}
                </p>
            </div>

            <div class="space-y-1.5">
                <FieldLabel :html-for="`m2_per_box-${group.id}`" text="m² por caja" required />
                <InputNumberCustom
                    :id="`m2_per_box-${group.id}`"
                    v-model="group.spec.m2_per_box"
                    :error="group.specErrors.m2_per_box"
                    :min="0"
                    placeholder="0.00"
                    @input="group.specErrors.m2_per_box = ''"
                    :max-fraction-digits="2"
                />
                <p v-if="group.specErrors.m2_per_box" class="text-danger text-[12px] mt-1.5">
                    {{ group.specErrors.m2_per_box }}
                </p>
            </div>

            <div class="space-y-1.5">
                <FieldLabel :html-for="`boxes_per_pallet-${group.id}`" text="Cajas por tarima" />
                <InputNumberCustom
                    :id="`boxes_per_pallet-${group.id}`"
                    v-model="group.spec.boxes_per_pallet"
                    :error="group.specErrors.boxes_per_pallet"
                    :min="0"
                    placeholder="0"
                    @input="group.specErrors.boxes_per_pallet = ''"
                    :max-fraction-digits="0"
                />
                <p v-if="group.specErrors.boxes_per_pallet" class="text-danger text-[12px] mt-1.5">
                    {{ group.specErrors.boxes_per_pallet }}
                </p>
            </div>
        </div>

        <!-- Grupo 4 — Dato interno del negocio, separado del resto (no viene de la hoja del proveedor) -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div class="space-y-1.5">
                <FieldLabel
                    :html-for="`commission_category_id-${group.id}`"
                    text="Categoría de comisión"
                />
                <SelectCustom
                    :id="`commission_category_id-${group.id}`"
                    v-model="group.spec.commission_category_id"
                    :options="commissionOptions"
                    option-label="label"
                    :loading="catalogs.loading"
                    :error="group.specErrors.commission_category_id"
                    placeholder="Sin categoría"
                    allow-empty
                    @change="group.specErrors.commission_category_id = ''"
                />
                <p
                    v-if="group.specErrors.commission_category_id"
                    class="text-danger text-[12px] mt-1.5"
                >
                    {{ group.specErrors.commission_category_id }}
                </p>
            </div>
        </div>

        <!-- Colores — lista repetible: cada fila se convierte en su propia variante -->
        <VariantColorsTable
            v-model:rows="group.colorRows"
            :stock-unit="stockUnit"
            :deleting-row-id="deletingRowId"
            @remove="(row) => emit('remove-color', row)"
        />
    </div>
</template>

<script setup>
import { computed } from "vue";
import { useCatalogsStore } from "@/stores/catalogs";
import SelectCustom from "@/components/widgets/SelectCustom.vue";
import InputTextCustom from "@/components/widgets/InputTextCustom.vue";
import InputNumberCustom from "@/components/widgets/InputNumberCustom.vue";
import FieldLabel from "@/components/widgets/labels/FieldLabel.vue";
import { formatCurrency } from "@/lib/formatCurrency";
import { PEI_OPTIONS } from "@/lib/productForm";
import { commissionLabel } from "@/lib/commissionCategories";
import VariantColorsTable from "./VariantColorsTable.vue";

// Tarjeta de una medida en ProductFormView: su ficha técnica (`group.spec`) y sus
// colores. `group` es el objeto reactivo de la vista (ver createVariantGroup en
// lib/productForm.js); los campos se editan sobre él directamente.
const group = defineModel("group", { type: Object, required: true });

defineProps({
    index: { type: Number, required: true },
    // Pisos por pieza: oculta PEI/ETT, precio por m² y datos por caja.
    soldByPiece: { type: Boolean, default: false },
    // { short, label } de variantStockUnit(): cajas o piezas.
    stockUnit: { type: Object, required: true },
    // Solo medidas sin variantes guardadas (lo decide la vista).
    removable: { type: Boolean, default: false },
    deletingRowId: { type: String, default: null },
});

const emit = defineEmits(["remove", "remove-color"]);

const catalogs = useCatalogsStore();

// "Vo · Verde oscuro"…, en el orden del backend (de la mayor a la menor comisión).
const commissionOptions = computed(() =>
    catalogs.commissionCategories.map((category) => ({ ...category, label: commissionLabel(category) })),
);
</script>

<style scoped></style>
