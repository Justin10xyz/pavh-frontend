<template>
    <!-- Independiente del status: un presupuesto pagado sigue en Borrador. -->
    <span
        class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border bg-sky-100 border-sky-200 text-sky-700 font-semibold whitespace-nowrap"
    >
        <i class="ti ti-check text-sm leading-none" aria-hidden="true"></i>
        Pagado
    </span>
</template>

<script setup>
// Badge "✓ Pagado" de un presupuesto con `paid_at`, compartido entre el
// listado (QuotesView) y el detalle (QuoteDetailView) para que se vean igual.
// Azul y no verde: verde ya es el status "Convertido".
</script>

<style scoped></style>
