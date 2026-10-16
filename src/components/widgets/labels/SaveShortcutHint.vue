<template>
    <!-- Solo desde sm: en pantallas táctiles no hay teclado físico que la aproveche.
	     `aria-hidden`: el atajo ya va en el `aria-keyshortcuts` del botón. -->
    <p class="hidden sm:block text-xs text-text-muted" aria-hidden="true">
        <kbd class="font-sans border border-border rounded px-1 py-0.5">{{ modifierLabel }}</kbd>
        +
        <kbd class="font-sans border border-border rounded px-1 py-0.5">S</kbd>
        para guardar
    </p>
</template>

<script setup>
// Pista visible del atajo de guardar de useSaveShortcut, junto a los botones
// de acción del form. `modifierLabel` es el que devuelve el composable.
defineProps({
    modifierLabel: { type: String, required: true },
})
</script>

<style scoped>

</style>
