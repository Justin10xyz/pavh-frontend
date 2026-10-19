<template>
    <span v-if="!tracked" class="text-xs px-2 py-0.5 rounded border border-border text-text-muted">
        Sin control
    </span>
    <span
        v-else
        class="text-xs px-2 py-0.5 rounded"
        :class="lowStock ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'"
    >
        {{ lowStock ? "Stock bajo" : "OK" }}
    </span>
</template>

<script setup>
// Estado de stock de una variante: columna Estado de VariantGroupPanel y
// encabezado de StockAdjustDialog (mismo indicador en ambos).
defineProps({
    // Con control de stock (`stock_boxes !== null`, ver isTracked en lib/variantStock.js).
    tracked: { type: Boolean, required: true },
    lowStock: { type: Boolean, default: false },
});
</script>

<style scoped></style>
