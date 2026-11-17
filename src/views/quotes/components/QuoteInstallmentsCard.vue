<template>
    <!-- Abonos: pagos parciales que se restan del saldo. Registrar y anular solo
	     en Borrador sin pagar (se ocultan, no se deshabilitan, igual que las
	     acciones del encabezado). -->
    <section
        v-if="showsInstallmentsCard(quote)"
        :aria-labelledby="headingId"
        class="bg-surface border border-border rounded-md overflow-hidden"
    >
        <div class="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 pt-5 sm:pt-6 mb-4">
            <h2 :id="headingId" class="text-xs font-medium uppercase tracking-wide text-text-muted">
                Abonos
            </h2>
            <button
                v-if="canRegisterInstallment(quote)"
                type="button"
                @click="dialogVisible = true"
                class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer inline-flex items-center gap-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
                <i class="ti ti-plus text-base" aria-hidden="true"></i>
                Registrar abono
            </button>
        </div>

        <p v-if="installments.length === 0" class="px-5 sm:px-6 pb-5 sm:pb-6 text-sm text-text-muted">
            Sin abonos registrados.
        </p>

        <template v-else>
            <DataTable :value="installments" data-key="id" class="data-table">
                <Column header="Fecha" body-class="whitespace-nowrap">
                    <template #body="{ data }">{{ formatDateOnly(data.payment_date) }}</template>
                </Column>
                <Column header="Nota">
                    <template #body="{ data }">
                        <span :class="data.notes ? 'text-text' : 'text-text-muted'">{{ data.notes || "—" }}</span>
                    </template>
                </Column>
                <Column header="Monto" header-class="text-right!" body-class="text-right whitespace-nowrap">
                    <template #body="{ data }">
                        <span class="tabular-nums">{{ formatCurrency(data.amount) }}</span>
                    </template>
                </Column>
                <Column v-if="canManage" header="" body-class="w-px text-right">
                    <template #body="{ data }">
                        <button
                            type="button"
                            :disabled="voidingId === data.id"
                            @click="requestVoid(data)"
                            :aria-label="`Anular abono de ${formatCurrency(data.amount)} del ${formatDateOnly(data.payment_date)}`"
                            title="Anular abono"
                            class="text-xs text-text-muted hover:text-danger underline rounded transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                        >
                            {{ voidingId === data.id ? "Anulando…" : "Anular" }}
                        </button>
                    </template>
                </Column>
            </DataTable>

            <div class="border-t border-border px-5 sm:px-6 py-3 flex items-center justify-between text-sm font-medium">
                <span class="text-text">Total abonado</span>
                <span class="text-text tabular-nums">{{ formatCurrency(quote.installments_total) }}</span>
            </div>
        </template>

        <p v-if="voidError" role="alert" class="px-5 sm:px-6 pb-4 text-danger text-xs">{{ voidError }}</p>

        <QuoteInstallmentDialog
            v-if="canManage"
            v-model:visible="dialogVisible"
            :quote-id="quote.id"
            :balance="quote.balance"
        />
    </section>
</template>

<script setup>
import { computed, ref, useId } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useConfirm } from "primevue/useconfirm";
import { useQuotesStore } from "@/stores/quotes";
import { useNotify } from "@/composables/useNotify";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatDateOnly } from "@/lib/dates";
import {
    canManageInstallments,
    canRegisterInstallment,
    showsInstallmentsCard,
} from "@/lib/quoteInstallments";
import QuoteInstallmentDialog from "./QuoteInstallmentDialog.vue";

// Card "Abonos" del detalle de cotización. Toda su lógica vive aquí y en
// lib/quoteInstallments.js; QuoteDetailView solo la monta. La confirmación de
// anular usa el ConfirmDialog (sin grupo) de QuoteDetailView, con su
// `acceptLabel` y `tone`.
const props = defineProps({
    quote: { type: Object, required: true },
});

const quotes = useQuotesStore();
const confirm = useConfirm();
const notify = useNotify();
const headingId = `installments-${useId()}`;

const installments = computed(() => props.quote.installments ?? []);
const canManage = computed(() => canManageInstallments(props.quote));

const dialogVisible = ref(false);
const voidingId = ref(null);
const voidError = ref(null);

function requestVoid(installment) {
    confirm.require({
        header: "Anular abono",
        message: `¿Anular el abono de ${formatCurrency(installment.amount)} del ${formatDateOnly(installment.payment_date)}? Dejará de contar en el saldo.`,
        acceptLabel: "Anular abono",
        tone: "danger",
        accept: () => voidInstallment(installment),
    });
}

async function voidInstallment(installment) {
    voidingId.value = installment.id;
    voidError.value = null;

    try {
        await quotes.voidQuoteInstallment(props.quote.id, installment.id);
        notify.success("Abono anulado", formatCurrency(installment.amount));
    } catch (err) {
        console.error(err);
        // 422 de negocio (la cotización ya se pagó o canceló en otra sesión).
        voidError.value =
            err.response?.status === 422
                ? err.response.data.message
                : "No se pudo anular el abono. Intenta de nuevo.";
    } finally {
        voidingId.value = null;
    }
}
</script>

<style scoped></style>
