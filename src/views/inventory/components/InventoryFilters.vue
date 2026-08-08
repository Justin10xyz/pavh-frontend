<template>
	<div class="flex flex-wrap items-center gap-3 mb-4">
		<div class="relative flex-1 min-w-[220px]">
			<svg
				class="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
				width="14" height="14" viewBox="0 0 24 24" fill="none"
				stroke="currentColor" stroke-width="2"
			>
				<circle cx="11" cy="11" r="7" />
				<line x1="21" y1="21" x2="16.65" y2="16.65" />
			</svg>
			<input
				v-model="searchQuery"
				type="text"
				placeholder="Buscar por línea, color o código…"
				class="w-full pl-8 pr-3 py-2 text-sm bg-surface border border-border rounded-md text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
			/>
		</div>

		<select
			v-model="selectedCategory"
			class="py-2 px-3 text-sm bg-surface border border-border rounded-md text-text focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
		>
			<option value="">Todas las categorías</option>
			<option v-for="cat in categoryOptions" :key="cat" :value="cat">{{ cat }}</option>
		</select>

		<label class="flex items-center gap-2 text-sm text-text select-none cursor-pointer">
			<input
				type="checkbox"
				v-model="lowStockOnly"
				class="w-4 h-4 rounded border-border text-accent focus:ring-accent"
			/>
			Solo stock bajo
		</label>

		<button
			v-if="hasActiveFilters"
			type="button"
			class="text-xs text-text-muted hover:text-text underline"
			@click="emit('clear-filters')"
		>
			Limpiar filtros
		</button>
	</div>
</template>

<script setup>
import { computed } from 'vue'

defineProps({
	categoryOptions: {
		type: Array,
		required: true,
	}
})

const emit = defineEmits(['clear-filters'])

const searchQuery = defineModel('searchQuery', { type: String, default: '' })
const selectedCategory = defineModel('selectedCategory', { type: String, default: '' })
const lowStockOnly = defineModel('lowStockOnly', { type: Boolean, default: false })

const hasActiveFilters = computed(
	() => searchQuery.value !== '' || selectedCategory.value !== '' || lowStockOnly.value
)
</script>
