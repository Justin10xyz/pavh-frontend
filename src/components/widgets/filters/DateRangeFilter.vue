<template>
    <QuickFilter
        :model-value="modelValue"
        :options="DATE_FILTERS"
        :label="label"
        @update:model-value="emit('update:modelValue', $event)"
    />
</template>

<script setup>
import QuickFilter from './QuickFilter.vue'

// Solo emite la clave del filtro ('all' | 'today' | 'week' | 'month'); el
// padre la convierte a { from, to } con dateRangeFor() de @/lib/dateRanges.
const DATE_FILTERS = [
    { key: 'all', label: 'Todas' },
    { key: 'today', label: 'Hoy' },
    { key: 'week', label: 'Esta semana' },
    { key: 'month', label: 'Este mes' },
]

defineProps({
    modelValue: {
        type: String,
        required: true,
    },
    label: {
        type: String,
        default: 'Filtrar por fecha',
    },
})

const emit = defineEmits(['update:modelValue'])
</script>

<style scoped>

</style>
