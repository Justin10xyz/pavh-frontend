<template>
    <!-- Pago y totales. Los totales viven aquí y no bajo las líneas porque
	     dependen de descuento/envío/anticipo. -->
    <div class="bg-surface border border-border rounded-md p-5 sm:p-6">
        <h2 class="text-xs font-medium uppercase tracking-wide text-text-muted mb-4">
            Pago
        </h2>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_16rem] gap-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
                <!-- Dos opciones: segmentado con radios nativos en vez de un Select.
				     El lector anuncia "Forma de pago, grupo" (legend) y cada opción como
				     radio con su posición; ←/→ cambian la opción y Tab entra solo al
				     marcado. Sin aria-pressed: eso es de botones de alternar (QuickFilter).
				     `relative` en cada label: el radio es sr-only (`position: absolute`) y
				     sin ancestro posicionado escapa del <main> con scroll, alarga el body
				     y al enfocarlo el navegador desplaza todo el layout. -->
                <fieldset class="space-y-1.5">
                    <legend class="text-xs font-medium text-text-muted block mb-1.5">Forma de pago</legend>
                    <div class="grid grid-cols-2 gap-2">
                        <label
                            v-for="option in PAYMENT_TERMS"
                            :key="option.key"
                            class="relative h-10 flex items-center justify-center text-sm bg-surface border rounded-md cursor-pointer transition-colors select-none has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-accent"
                            :class="
                                form.payment_terms === option.key
                                    ? 'border-accent text-text font-medium'
                                    : 'border-border text-text-muted hover:text-text'
                            "
                        >
                            <input
                                v-model="form.payment_terms"
                                type="radio"
                                name="payment_terms"
                                :value="option.key"
                                :aria-invalid="errors.payment_terms ? 'true' : undefined"
                                class="sr-only"
                            />
                            {{ option.label }}
                        </label>
                    </div>
                    <p v-if="errors.payment_terms" class="text-danger text-xs mt-1.5">
                        {{ errors.payment_terms }}
                    </p>
                </fieldset>

                <!-- Requerida con crédito: el backend la exige (required_if). -->
                <div v-if="form.payment_terms === 'credit'" class="space-y-1.5">
                    <FieldLabel html-for="credit_due_date" text="Vencimiento del crédito" required />
                    <InputTextCustom
                        id="credit_due_date"
                        v-model="form.credit_due_date"
                        type="date"
                        :error="errors.credit_due_date"
                        @input="errors.credit_due_date = ''"
                    />
                    <p v-if="errors.credit_due_date" class="text-danger text-xs mt-1.5">
                        {{ errors.credit_due_date }}
                    </p>
                </div>
                <div v-else class="hidden sm:block" aria-hidden="true"></div>

                <!-- Descuento: en monto o en % del subtotal. El selector usa radios
				     nativos como "Forma de pago" (Enter/Tab entran solo al marcado, ver
				     lib/formKeyboard.js). form.discount siempre guarda el monto; en
				     modo % se calcula del porcentaje y no se edita a mano. -->
                <div class="space-y-1.5">
                    <FieldLabel html-for="discount" text="Descuento" />
                    <div class="flex gap-2">
                        <fieldset class="shrink-0">
                            <legend class="sr-only">Capturar descuento en</legend>
                            <div class="grid grid-cols-2 gap-1">
                                <label
                                    v-for="option in DISCOUNT_MODES"
                                    :key="option.key"
                                    class="relative w-10 h-10 flex items-center justify-center text-sm bg-surface border rounded-md cursor-pointer transition-colors select-none has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-accent"
                                    :class="
                                        discountMode === option.key
                                            ? 'border-accent text-text font-medium'
                                            : 'border-border text-text-muted hover:text-text'
                                    "
                                >
                                    <input
                                        :checked="discountMode === option.key"
                                        type="radio"
                                        name="discount_mode"
                                        :value="option.key"
                                        :aria-label="option.ariaLabel"
                                        class="sr-only"
                                        @change="setDiscountMode(option.key)"
                                    />
                                    <span aria-hidden="true">{{ option.label }}</span>
                                </label>
                            </div>
                        </fieldset>
                        <div class="flex-1 min-w-0">
                            <InputNumberCustom
                                v-if="discountMode === 'percent'"
                                id="discount"
                                key="discount-percent"
                                v-model="discountPercent"
                                :min="0"
                                :max="100"
                                :max-fraction-digits="2"
                                suffix="%"
                                placeholder="0%"
                                :error="errors.discount"
                                @update:model-value="errors.discount = ''"
                            />
                            <InputNumberCustom
                                v-else
                                id="discount"
                                key="discount-amount"
                                v-model="form.discount"
                                :min="0"
                                placeholder="$0.00"
                                mode="currency"
                                currency="MXN"
                                :error="errors.discount"
                                @update:model-value="errors.discount = ''"
                            />
                        </div>
                    </div>
                    <p v-if="discountMode === 'percent'" class="text-xs text-text-muted">
                        Equivale a {{ formatCurrency(form.discount) }}
                    </p>
                    <p v-if="errors.discount" class="text-danger text-xs mt-1.5">
                        {{ errors.discount }}
                    </p>
                </div>

                <!-- Costo de envío y anticipo: mismo campo de monto opcional -->
                <div v-for="field in AMOUNT_FIELDS" :key="field.key" class="space-y-1.5">
                    <FieldLabel :html-for="field.key" :text="field.label" />
                    <InputNumberCustom
                        :id="field.key"
                        v-model="form[field.key]"
                        :min="0"
                        placeholder="$0.00"
                        mode="currency"
                        currency="MXN"
                        :error="errors[field.key]"
                        @update:model-value="errors[field.key] = ''"
                    />
                    <p v-if="errors[field.key]" class="text-danger text-xs mt-1.5">
                        {{ errors[field.key] }}
                    </p>
                </div>
            </div>

            <!-- Preview: el backend recalcula todo al guardar. Mismos renglones
			     que el detalle y el PDF (descuento/envío/anticipo solo si > 0). -->
            <div
                class="space-y-1.5 pt-4 border-t border-border lg:pt-0 lg:border-t-0 lg:pl-6 lg:border-l"
                aria-live="polite"
            >
                <div class="flex items-center justify-between text-sm">
                    <span class="text-text-muted">Subtotal</span>
                    <span class="text-text tabular-nums">{{ formatCurrency(subtotal) }}</span>
                </div>
                <!-- El precio de mayoreo se elige en cada línea, lejos de aquí, y el
				     PDF ya no lo anota: se recuerda que el subtotal ya lo incluye. -->
                <p v-if="wholesaleCount > 0" class="text-xs text-text-muted">
                    Incluye precio de mayoreo en {{ wholesaleCount }}
                    {{ wholesaleCount === 1 ? "producto" : "productos" }}.
                </p>
                <div v-if="Number(form.discount) > 0" class="flex items-center justify-between text-sm">
                    <span class="text-text-muted">Descuento</span>
                    <span class="text-text tabular-nums">-{{ formatCurrency(form.discount) }}</span>
                </div>
                <div v-if="Number(form.shipping_cost) > 0" class="flex items-center justify-between text-sm">
                    <span class="text-text-muted">Costo de envío</span>
                    <span class="text-text tabular-nums">{{ formatCurrency(form.shipping_cost) }}</span>
                </div>
                <div class="flex items-center justify-between text-sm font-medium">
                    <span class="text-text">Total</span>
                    <span class="text-text tabular-nums">{{ formatCurrency(totals.total) }}</span>
                </div>
                <div v-if="Number(form.down_payment) > 0" class="flex items-center justify-between text-sm">
                    <span class="text-text-muted">Anticipo</span>
                    <span class="text-text tabular-nums">-{{ formatCurrency(form.down_payment) }}</span>
                </div>
                <!-- Puede quedar negativo a propósito (anticipo mayor al total):
				     se muestra con su signo, sin tratarlo como error. -->
                <div class="flex items-center justify-between text-sm font-medium pt-1.5 border-t border-border">
                    <span class="text-text">Saldo</span>
                    <span class="text-text tabular-nums">{{ formatCurrency(totals.balance) }}</span>
                </div>
                <!-- Mismo cierre que el detalle y el PDF: forma de pago y vencimiento -->
                <div class="flex items-center justify-between gap-3 text-sm">
                    <span class="text-text-muted">Forma de pago</span>
                    <span class="text-text text-right">{{ paymentTermsLabel(form.payment_terms) }}</span>
                </div>
                <div
                    v-if="form.payment_terms === 'credit' && form.credit_due_date"
                    class="flex items-center justify-between gap-3 text-sm"
                >
                    <span class="text-text-muted">Vence</span>
                    <span class="text-text text-right whitespace-nowrap">{{ formatDateOnly(form.credit_due_date) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";
import InputTextCustom from "@/components/widgets/InputTextCustom.vue";
import InputNumberCustom from "@/components/widgets/InputNumberCustom.vue";
import FieldLabel from "@/components/widgets/labels/FieldLabel.vue";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatDateOnly } from "@/lib/dates";
import {
    PAYMENT_TERMS,
    discountFromPercent,
    paymentTermsLabel,
    percentFromDiscount,
} from "@/lib/quotePayment";

// Sección "Pago" de QuoteFormView: forma de pago, vencimiento, montos y el
// preview de totales. Edita los campos de pago sobre el mismo `form` de la
// vista (`v-model:form`) y limpia el error de un campo al capturarlo
// (`v-model:errors`); validar, limpiar el vencimiento al pasar a contado y
// enviar sigue en la vista. `subtotal` y `totals` los calcula la vista, que
// también los necesita para atribuir el 422 del descuento.
const form = defineModel("form", { type: Object, required: true });
const errors = defineModel("errors", { type: Object, required: true });

const props = defineProps({
    subtotal: { type: Number, required: true },
    totals: { type: Object, required: true },
    // Líneas de producto simple a precio de mayoreo (la vista las cuenta).
    wholesaleCount: { type: Number, default: 0 },
});

// Modo de captura del descuento. Es solo de la UI: el backend guarda el monto,
// así que siempre inicia en monto, también al editar.
const DISCOUNT_MODES = [
    { key: "amount", label: "$", ariaLabel: "Monto" },
    { key: "percent", label: "%", ariaLabel: "Porcentaje" },
];
const discountMode = ref("amount");
const discountPercent = ref(null);
// Al pasar a % el porcentaje se deriva del monto y el monto no debe cambiar
// (el redondeo de ida y vuelta lo movería unos centavos): se salta esa sync.
let skipPercentSync = false;

function setDiscountMode(mode) {
    if (mode === discountMode.value) return;
    discountMode.value = mode;
    // %→$: form.discount ya tiene el monto calculado y se queda igual.
    if (mode !== "percent") return;

    const percent = percentFromDiscount(props.subtotal, form.value.discount);
    // Si el % no cambia, el watch no corre y la bandera se quedaría puesta.
    if (percent !== discountPercent.value) skipPercentSync = true;
    discountPercent.value = percent;
}

// En modo %, el monto se recalcula al cambiar el porcentaje o el subtotal
// (al editar líneas). Sin porcentaje el descuento queda en null (no aplica),
// igual que un monto vacío, en vez de 0.
watch([discountPercent, () => props.subtotal], () => {
    if (skipPercentSync) {
        skipPercentSync = false;
        return;
    }
    if (discountMode.value !== "percent") return;
    form.value.discount =
        discountPercent.value === null ? null : discountFromPercent(props.subtotal, discountPercent.value);
});

const AMOUNT_FIELDS = [
    { key: "shipping_cost", label: "Costo de envío" },
    { key: "down_payment", label: "Anticipo" },
];
</script>

<style scoped></style>
