<template>
	<section aria-labelledby="low-stock-heading" class="bg-surface border border-border rounded-md">
		<div class="flex items-center justify-between px-5 py-3 border-b border-border">
			<h2 id="low-stock-heading" class="text-sm font-medium text-text">Stock bajo</h2>
			<router-link
				:to="{ name: 'inventory' }"
				class="text-xs text-text-muted hover:text-text focus:outline-none focus-visible:underline transition-colors"
			>
				Ver todo
			</router-link>
		</div>

		<p v-if="variants.length === 0" class="px-5 py-6 text-sm text-text-muted text-center">
			No hay productos con stock bajo.
		</p>
		<ul v-else class="divide-y divide-border">
			<li
				v-for="variant in variants"
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
		</ul>
	</section>
</template>

<script setup>
defineProps({
	// Variantes con `product: { id, name }` anidado (forma de dashboard.lowStockVariants).
	variants: {
		type: Array,
		required: true,
	},
})
</script>

<style scoped>

</style>
