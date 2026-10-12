<template>
	<section aria-labelledby="top-products-heading" :aria-busy="loading" class="bg-surface border border-border rounded-md">
		<div class="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border">
			<h2 id="top-products-heading" class="text-sm font-medium text-text">Productos más vendidos</h2>
			<DateRangeFilter
				:model-value="filter"
				label="Filtrar productos más vendidos por fecha"
				@update:model-value="emit('update:filter', $event)"
			/>
		</div>

		<p v-if="error && !loading" class="px-5 py-6 text-sm text-danger text-center">
			{{ error }}
		</p>

		<p v-else-if="!loading && products.length === 0" class="px-5 py-6 text-sm text-text-muted text-center">
			No hay ventas en este periodo.
		</p>

		<div v-else class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border">
						<th scope="col" class="px-5 py-2 text-left text-xs font-medium text-text-muted">Producto</th>
						<th scope="col" class="px-5 py-2 text-right text-xs font-medium text-text-muted">Cantidad vendida</th>
						<th scope="col" class="px-5 py-2 text-right text-xs font-medium text-text-muted">Monto</th>
					</tr>
				</thead>

				<tbody v-if="loading" class="divide-y divide-border" aria-hidden="true">
					<tr v-for="n in 3" :key="n">
						<td class="px-5 py-3"><span class="block h-4 w-40 rounded bg-border animate-pulse"></span></td>
						<td class="px-5 py-3"><span class="block h-4 w-16 ml-auto rounded bg-border animate-pulse"></span></td>
						<td class="px-5 py-3"><span class="block h-4 w-20 ml-auto rounded bg-border animate-pulse"></span></td>
					</tr>
				</tbody>

				<tbody v-else class="divide-y divide-border">
					<tr v-for="product in products" :key="`${product.type}-${product.product_variant_id ?? product.simple_product_id}`">
						<td class="px-5 py-3 text-text">{{ product.name }}</td>
						<!-- Cada fila en su unidad: m² para variantes, unidades para productos simples -->
						<td class="px-5 py-3 text-right text-text tabular-nums whitespace-nowrap">
							{{ formatQuantity(product.quantity_sold) }} {{ product.type === 'simple' ? 'uds.' : 'm²' }}
						</td>
						<td class="px-5 py-3 text-right text-text tabular-nums whitespace-nowrap">{{ formatCurrency(product.revenue) }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</template>

<script setup>
import { formatCurrency } from '@/lib/formatCurrency'
import { formatQuantity } from '@/lib/formatQuantity'
import DateRangeFilter from '@/components/widgets/filters/DateRangeFilter.vue'

defineProps({
	// Filas de GET /api/dashboard/top-products, ya ordenadas por monto y limitadas por el backend.
	products: {
		type: Array,
		required: true,
	},
	// Clave del filtro de fecha activo ('all' | 'today' | 'week' | 'month').
	filter: {
		type: String,
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

const emit = defineEmits(['update:filter'])
</script>

<style scoped>

</style>
