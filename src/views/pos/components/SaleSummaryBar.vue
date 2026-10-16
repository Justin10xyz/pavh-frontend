<template>
    <!-- Barra fija al fondo: con varias líneas, total y acciones quedan a la
         vista sin bajar hasta el final del form (relevante en tablet de
         mostrador). El error de registro va aquí, junto a las acciones.
         z-[1]: encima de las filas, pero debajo del dropdown del buscador (z-10). -->
    <div class="sticky bottom-0 z-[1] space-y-3 bg-surface border border-border rounded-md px-4 py-3">
        <p v-if="error" role="alert" class="text-danger text-sm flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {{ error }}
        </p>

        <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-text-muted" aria-live="polite">
                {{ productCount }} {{ productCount === 1 ? 'producto' : 'productos' }}
                <span aria-hidden="true">·</span>
                Total <span class="font-semibold text-primary tabular-nums">{{ formatCurrency(total) }}</span>
            </p>

            <div class="flex items-center gap-3">
                <!-- Conversión: volver a la cotización (pasa por la confirmación de
                     salida si hay cambios). Venta directa: limpiar para empezar otra. -->
                <RouterLink
                    v-if="quoteId"
                    :to="{ name: 'quotes.show', params: { id: quoteId } }"
                    class="inline-flex items-center bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none"
                >
                    Cancelar
                </RouterLink>
                <button
                    v-else
                    type="button"
                    :disabled="!canClear"
                    @click="emit('clear')"
                    class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer disabled:opacity-50 disabled:hover:bg-surface disabled:cursor-not-allowed"
                >
                    Limpiar
                </button>
                <!-- Va dentro del <form> de SaleFormView: este submit lo envía -->
                <button
                    type="submit"
                    :disabled="submitting"
                    class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                >
                    {{ submitting ? 'Registrando…' : 'Registrar venta' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { formatCurrency } from '@/lib/formatCurrency'

// Resumen y acciones del form de venta. Solo muestra: el registro (submit del
// form) y la confirmación de "Limpiar" los resuelve SaleFormView.

defineProps({
    error: { type: String, default: null },
    productCount: { type: Number, required: true },
    total: { type: Number, required: true },
    // Con cotización de origen, "Cancelar" vuelve a ella en vez de ofrecer "Limpiar".
    quoteId: { type: [String, Number], default: null },
    canClear: { type: Boolean, default: false },
    submitting: { type: Boolean, default: false },
})

const emit = defineEmits(['clear'])
</script>

<style scoped>

</style>
