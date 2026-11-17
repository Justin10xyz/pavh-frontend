<template>
    <Dialog v-model:visible="visible" modal :pt="{ mask: { class: 'bg-primary/50' } }" @show="onShow" @hide="reset">
        <template #container="{ closeCallback }">
            <!-- Enter avanza de campo (lib/formKeyboard.js); Ctrl/⌘+S o Ctrl/⌘+Enter
			     guardan (useSaveShortcut). -->
            <form
                ref="formRef"
                novalidate
                class="bg-surface border border-border rounded-md p-4 sm:p-5 w-95 max-w-[90vw]"
                @submit.prevent="submit"
                @keydown="advanceOnEnter"
            >
                <div class="flex items-center justify-between mb-1">
                    <h3 class="font-serif text-base text-primary">Registrar abono</h3>
                    <button
                        type="button"
                        @click="closeCallback"
                        class="text-text-muted hover:text-text transition-colors cursor-pointer rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                        aria-label="Cerrar"
                    >
                        <i class="ti ti-x text-base" aria-hidden="true"></i>
                    </button>
                </div>
                <p class="text-sm text-text-muted mb-4">
                    Saldo pendiente: <span class="font-medium text-text tabular-nums">{{ formatCurrency(balance) }}</span>
                </p>

                <div class="space-y-4">
                    <div class="space-y-1.5">
                        <FieldLabel :html-for="`${idPrefix}-amount`" text="Monto" required />
                        <InputNumberCustom
                            :id="`${idPrefix}-amount`"
                            v-model="form.amount"
                            :min="0.01"
                            placeholder="$0.00"
                            mode="currency"
                            currency="MXN"
                            :error="errors.amount"
                            @update:model-value="errors.amount = ''"
                        />
                        <!-- También el 422 de negocio (abono mayor que el saldo, cotización
						     ya pagada): no trae `errors` y el monto es lo que se corrige. -->
                        <p v-if="errors.amount" class="text-danger text-xs mt-1.5">{{ errors.amount }}</p>
                    </div>

                    <div class="space-y-1.5">
                        <FieldLabel :html-for="`${idPrefix}-date`" text="Fecha" required />
                        <InputTextCustom
                            :id="`${idPrefix}-date`"
                            v-model="form.payment_date"
                            type="date"
                            :max="today"
                            :error="errors.payment_date"
                            @input="errors.payment_date = ''"
                        />
                        <p v-if="errors.payment_date" class="text-danger text-xs mt-1.5">{{ errors.payment_date }}</p>
                    </div>

                    <div class="space-y-1.5">
                        <FieldLabel :html-for="`${idPrefix}-notes`" text="Nota" />
                        <InputTextCustom
                            :id="`${idPrefix}-notes`"
                            v-model="form.notes"
                            :maxlength="INSTALLMENT_NOTES_MAX"
                            placeholder="Opcional (ej. transferencia, efectivo)"
                            :error="errors.notes"
                            @input="errors.notes = ''"
                        />
                        <p v-if="errors.notes" class="text-danger text-xs mt-1.5">{{ errors.notes }}</p>
                    </div>
                </div>

                <!-- Errores sin campo (red, 500) junto a las acciones. -->
                <p v-if="generalError" role="alert" class="text-danger text-xs mt-4">{{ generalError }}</p>

                <div class="flex items-center justify-end gap-3 mt-5">
                    <SaveShortcutHint :modifier-label="modifierLabel" class="mr-auto" />
                    <button
                        type="button"
                        @click="closeCallback"
                        class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        :aria-keyshortcuts="ariaKeyshortcuts"
                        :disabled="submitting"
                        class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-1"
                    >
                        {{ submitting ? "Guardando…" : "Registrar abono" }}
                    </button>
                </div>
            </form>
        </template>
    </Dialog>
</template>

<script setup>
import { nextTick, reactive, ref, useId } from "vue";
import Dialog from "primevue/dialog";
import { useQuotesStore } from "@/stores/quotes";
import InputNumberCustom from "@/components/widgets/InputNumberCustom.vue";
import InputTextCustom from "@/components/widgets/InputTextCustom.vue";
import FieldLabel from "@/components/widgets/labels/FieldLabel.vue";
import SaveShortcutHint from "@/components/widgets/labels/SaveShortcutHint.vue";
import { useSaveShortcut } from "@/composables/useSaveShortcut";
import { useNotify } from "@/composables/useNotify";
import { advanceOnEnter, focusFirstInvalidField } from "@/lib/formKeyboard";
import { formatCurrency } from "@/lib/formatCurrency";
import {
    INSTALLMENT_NOTES_MAX,
    installmentPayload,
    localToday,
    validateInstallment,
} from "@/lib/quoteInstallments";

// Diálogo "Registrar abono" de QuoteInstallmentsCard. Guarda con el store
// (actualiza saldo y lista in-place) y se cierra; los errores se quedan
// inline en el diálogo.
const props = defineProps({
    quoteId: { type: [Number, String], required: true },
    // Saldo pendiente actual, solo informativo (el backend valida el tope).
    balance: { type: [Number, String], required: true },
});

const visible = defineModel("visible", { type: Boolean, default: false });

const quotes = useQuotesStore();
const notify = useNotify();
const idPrefix = `installment-${useId()}`;

const formRef = ref(null);
const submitting = ref(false);
const generalError = ref(null);
// Se recalcula al abrir: el diálogo puede quedar montado de un día a otro.
const today = ref(localToday());

function emptyForm() {
    return { amount: null, payment_date: today.value, notes: "" };
}

const form = reactive(emptyForm());
const errors = reactive({ amount: "", payment_date: "", notes: "" });

// Solo con el diálogo abierto: cerrado, `formRef` no existe.
const { modifierLabel, ariaKeyshortcuts } = useSaveShortcut(formRef, () => visible.value && !submitting.value);

function reset() {
    today.value = localToday();
    Object.assign(form, emptyForm());
    Object.assign(errors, { amount: "", payment_date: "", notes: "" });
    generalError.value = null;
}

// Al abrir, el foco va al Monto (primer campo).
async function onShow() {
    reset();
    await nextTick();
    document.getElementById(`${idPrefix}-amount`)?.focus();
}

async function submit() {
    generalError.value = null;
    Object.assign(errors, validateInstallment(form, today.value));
    if (Object.values(errors).some(Boolean)) {
        focusFirstInvalidField(formRef.value);
        return;
    }

    submitting.value = true;
    try {
        await quotes.addQuoteInstallment(props.quoteId, installmentPayload(form));
        notify.success("Abono registrado", formatCurrency(form.amount));
        visible.value = false;
    } catch (err) {
        if (err.response?.status === 422) {
            applyServerErrors(err.response.data);
        } else {
            console.error(err);
            generalError.value = "No se pudo registrar el abono. Intenta de nuevo.";
        }
    } finally {
        submitting.value = false;
    }
}

// 422 de validación: cada error bajo su campo. 422 de negocio (sin `errors`):
// bajo Monto, que es lo que se corrige (abono mayor que el saldo, sin saldo,
// cotización ya pagada o cancelada).
function applyServerErrors(data) {
    const serverErrors = data.errors ?? {};
    const fields = Object.keys(serverErrors).filter((field) => field in errors);

    if (fields.length === 0) errors.amount = data.message;
    for (const field of fields) errors[field] = serverErrors[field][0];

    focusFirstInvalidField(formRef.value);
}
</script>

<style scoped></style>
