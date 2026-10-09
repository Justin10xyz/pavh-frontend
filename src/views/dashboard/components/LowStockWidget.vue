<template>
	<section aria-labelledby="low-stock-heading" :aria-busy="loading" class="bg-surface border border-border rounded-md">
		<div class="flex items-center justify-between px-5 py-3 border-b border-border">
			<h2 id="low-stock-heading" class="text-sm font-medium text-text">Stock bajo</h2>
			<router-link
				:to="{ name: 'inventory' }"
				class="text-xs text-text-muted hover:text-text focus:outline-none focus-visible:underline transition-colors"
			>
				Ver todo
			</router-link>
		</div>

		<p v-if="error && !loading" class="px-5 py-6 text-sm text-danger text-center">
			{{ error }}
		</p>

		<ul v-else-if="loading" class="divide-y divide-border" aria-hidden="true">
			<li v-for="n in 3" :key="n" class="flex items-center justify-between gap-4 px-5 py-3">
				<span class="flex-1">
					<span class="block h-4 w-32 rounded bg-border animate-pulse"></span>
					<span class="block h-3 w-24 mt-1.5 rounded bg-border animate-pulse"></span>
				</span>
				<span class="flex flex-col items-end">
					<span class="block h-4 w-16 rounded bg-border animate-pulse"></span>
					<span class="block h-3 w-14 mt-1.5 rounded bg-border animate-pulse"></span>
				</span>
			</li>
		</ul>

		<p v-else-if="variants.length === 0" class="px-5 py-6 text-sm text-text-muted text-center">
			No hay productos con stock bajo.
		</p>
		<ul v-else class="divide-y divide-border">
			<li
				v-for="variant in visibleVariants"
				:key="variant.id"
				class="flex items-center justify-between gap-4 px-5 py-3"
			>
				<span class="min-w-0">
					<span class="block text-sm text-text truncate">{{ variant.product.name }}</span>
					<span class="block text-xs text-text-muted truncate">{{ variant.color }} · {{ variant.size }}</span>
				</span>
				<span class="text-right flex-shrink-0">
					<span class="block text-sm font-medium text-danger tabular-nums">{{ variant.stock_boxes }} cajas</span>
					<span class="block text-xs text-text-muted tabular-nums">Mínimo {{ variant.minimum_stock }}</span>
				</span>
			</li>
			<li v-if="hiddenCount > 0" class="px-5 py-2.5 text-xs text-text-muted">
				Y {{ hiddenCount }} más con stock bajo.
			</li>
		</ul>
	</section>
</template>

<script setup>
import { computed } from 'vue'

const MAX_ROWS = 5

const props = defineProps({
	// Variantes con `product: { id, name }` anidado (forma de dashboard.lowStockVariants).
	variants: {
		type: Array,
		required: true,
	},
	loading: {
		type: Boolean,
		default: false,
	},
	error: {
		type: String,
		default: null,
	},
})

// Lista corta: primero las más críticas (menos cajas en stock); el resto se
// consulta en Inventario vía "Ver todo".
const visibleVariants = computed(() =>
	[...props.variants]
		.sort((a, b) => a.stock_boxes - b.stock_boxes)
		.slice(0, MAX_ROWS)
)

const hiddenCount = computed(() => Math.max(props.variants.length - MAX_ROWS, 0))
</script>

<style scoped>

</style>
