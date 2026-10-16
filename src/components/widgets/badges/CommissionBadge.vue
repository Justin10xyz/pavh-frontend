<template>
    <span
        class="inline-flex items-center gap-1.5 text-xs text-text-muted border border-border rounded px-1.5 py-0.5 whitespace-nowrap"
        :title="commissionLabel(category)"
    >
        <span
            class="w-2 h-2 rounded-full shrink-0 ring-1 ring-black/10"
            :class="commissionDotClass(category.tier)"
            aria-hidden="true"
        ></span>
        <span>{{ category.code }}</span>
        <span v-if="category.name" class="sr-only">{{ category.name }}</span>
    </span>
</template>

<script setup>
import { commissionDotClass, commissionLabel } from "@/lib/commissionCategories";

// Código de comisión de una variante: punto de color por nivel + el código
// escrito (el color nunca va solo). El nombre ("Verde oscuro") va en `title` y
// para lectores de pantalla. Se usa en Inventario y en las líneas de
// Cotizaciones/Ventas, donde el vendedor decide cuánto descuento puede dar.

defineProps({
    // { code, name, tier } de commission_category.
    category: { type: Object, required: true },
});
</script>

<style scoped></style>
