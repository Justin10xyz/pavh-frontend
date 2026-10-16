<template>
    <div class="flex flex-wrap items-center gap-2" role="group" :aria-label="label">
        <button
            v-for="option in options"
            :key="option.key"
            type="button"
            class="text-sm px-3 py-2 bg-surface border rounded-md cursor-pointer transition-colors select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            :class="
                modelValue === option.key
                    ? 'border-accent text-text font-medium'
                    : 'border-border text-text-muted hover:text-text'
            "
            :aria-pressed="modelValue === option.key"
            @click="emit('update:modelValue', option.key)"
        >
            {{ option.label }}
            <span v-if="option.count != null" class="tabular-nums text-text-muted"
            >({{ option.count }})</span
            >
        </button>
    </div>
</template>

<script setup>
// Grupo de botones de filtro rápido (uno activo a la vez). Solo emite la clave
// de la opción elegida; cada consumidor decide qué hacer con ella.
// `count` es opcional: si viene, se muestra junto al label (ej. "Borrador (3)").
defineProps({
    modelValue: {
        type: String,
        required: true,
    },
    options: {
        type: Array,
        required: true,
    },
    label: {
        type: String,
        required: true,
    },
});

const emit = defineEmits(["update:modelValue"]);
</script>

<style scoped></style>
