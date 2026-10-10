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
			<InputTextCustom
				v-model="searchQuery"
				placeholder="Buscar por línea, color o código…"
				class="pl-8"
			/>
		</div>

		<div class="w-full sm:w-56">
			<SelectCustom
				v-model="selectedCategory"
				:options="categoryOptions"
				placeholder="Todas las categorías"
				allow-empty
			/>
		</div>

		<label class="flex items-center gap-2 text-sm text-text select-none cursor-pointer">
			<CheckboxCustom v-model="lowStockOnly" />
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
import SelectCustom from '@/components/widgets/SelectCustom.vue'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'
import CheckboxCustom from '@/components/widgets/CheckboxCustom.vue'

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
