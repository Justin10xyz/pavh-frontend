<template>
	<div class="p-6">
		<div class="flex items-center justify-between mb-4">
			<h1 class="font-serif text-xl text-primary">Inventario</h1>
		</div>

		<div v-if="inventory.loading" class="text-text-muted text-sm">Cargando productos…</div>
		<div v-else-if="inventory.error" class="text-danger text-sm">{{ inventory.error }}</div>


		<div v-else class="bg-surface border border-border rounded-md overflow-hidden">
			<DataTable :value="inventory.products" dataKey="id" v-model:expandedRows="expandedRows" class="inventory-table">
				<Column header="Producto">
					<template #body="{ data, rowTogglerCallback }">
						<div class="flex items-center gap-2">
							<button
								type="button"
								class="toggle-btn"
								:class="{ 'is-open': expandedRows[data.id] }"
								@click="rowTogglerCallback"
								:aria-label="expandedRows[data.id] ? 'Colapsar' : 'Expandir'"
							>
								<svg viewBox="0 0 8 8" width="8" height="8">
									<path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
								</svg>
							</button>
							<span class="font-serif font-medium text-primary">{{ data.name }}</span>
							<!-- Badge del producto -->
							<span class="text-[10px] text-text-muted border border-border rounded px-1.5 py-0.5">
								{{ data.category }} · {{ data.supplier }} · {{ data.unit_type }}
							</span>
						</div>
					</template>
				</Column>

				<Column header="Variantes" style="width: 8rem">
					<template #body="{ data }">
						<span class="text-text-muted">{{ data.variants.length }}</span>
					</template>
				</Column>

				<template #expansion="{ data }">
					<div class="bg-bg px-4 py-2 space-y-1.5">
						<div
							v-for="group in groupVariants(data.variants)"
							:key="group.key"
							class="border border-border rounded-md overflow-hidden bg-surface"
						>
							<button
								type="button"
								class="group-header"
								@click="toggleGroup(data.id, group.key)"
								title="Clic para ver stock por color"
								:aria-label="isGroupExpanded(data.id, group.key) ? 'Colapsar colores' : 'Expandir colores'"
							>
								<span class="toggle-btn" :class="{ 'is-open': isGroupExpanded(data.id, group.key) }">
									<svg viewBox="0 0 8 8" width="8" height="8">
										<path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
									</svg>
								</span>
								<span class="font-medium text-text">{{ group.size }}</span>
								<span class="spec-badge">PEI {{ group.pei }}</span>
								<span class="spec-badge">ETT {{ group.ett }}</span>
								<span v-if="group.commission_category" class="spec-badge">{{ group.commission_category.code }}</span>
								<span class="text-text">${{ Number(group.price_per_box).toFixed(2) }}/caja</span>
								<span class="text-text-muted">
									${{ Number(group.price_per_m2).toFixed(2) }}/m² · {{ group.pieces_per_box }} pzas/caja ·
									{{ Number(group.m2_per_box).toFixed(2) }} m²/caja
								</span>
								<span class="ml-auto text-text-muted">{{ group.variants.length }} colores</span>
							</button>

							<table v-if="isGroupExpanded(data.id, group.key)" class="w-full text-xs border-t border-border">
								<thead>
									<tr class="text-text-muted uppercase text-[10px]">
										<th class="text-left font-medium py-1.5 pl-8">Color</th>
										<th class="text-left font-medium py-1.5">Código</th>
										<th class="text-right font-medium py-1.5">Precio/caja</th>
										<th class="text-right font-medium py-1.5">Stock</th>
										<th class="text-center font-medium py-1.5 pr-6">Estado</th>
									</tr>
								</thead>
								<tbody>
									<tr v-for="variant in group.variants" :key="variant.id" class="border-t border-border">
										<td class="py-1.5 pl-8">{{ variant.color }}</td>
										<td class="py-1.5 text-text-muted font-mono text-[11px]">{{ variant.code }}</td>
										<td class="py-1.5">${{ Number(variant.price_per_box).toFixed(2) }}</td>
										<td class="py-1.5" :class="variant.low_stock ? 'text-danger font-medium' : 'text-text'">
											{{ variant.stock_boxes }} cj
										</td>
										<td class="py-1.5 pr-6">
											<span
												class="text-[10px] px-2 py-0.5 rounded"
												:class="variant.low_stock ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'"
											>
												{{ variant.low_stock ? 'Stock bajo' : 'OK' }}
											</span>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</template>
			</DataTable>
		</div>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useInventoryStore } from '@/stores/inventory'
import { groupVariants } from '@/lib/groupVariants'

const inventory = useInventoryStore()

const expandedRows = ref({})
const expandedGroups = ref({})

onMounted(() => {
	if (!inventory.initialized) inventory.fetchProducts()
})

function groupExpansionKey(productId, groupKey) {
	return `${productId}::${groupKey}`
}

function toggleGroup(productId, groupKey) {
	const key = groupExpansionKey(productId, groupKey)
	expandedGroups.value[key] = !expandedGroups.value[key]
}

function isGroupExpanded(productId, groupKey) {
	return !!expandedGroups.value[groupExpansionKey(productId, groupKey)]
}
</script>

<style scoped>
.toggle-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border-radius: 3px;
	color: var(--color-text-muted);
	flex-shrink: 0;
}
.toggle-btn:hover {
	background: var(--color-bg);
	color: var(--color-text);
}
.toggle-btn svg {
	transition: transform 150ms ease;
}
.toggle-btn.is-open svg {
	transform: rotate(90deg);
}

.inventory-table :deep(table) {
	width: 100%;
	border-collapse: collapse;
}
.inventory-table :deep(thead th) {
	text-align: left;
	font-size: 11px;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.03em;
	color: var(--color-text-muted);
	background: var(--color-bg);
	padding: 0.5rem 0.75rem;
	border-bottom: 1px solid var(--color-border);
}
.inventory-table :deep(tbody > tr:not(.p-datatable-row-expansion) > td) {
	padding: 0.5rem 0.75rem;
	vertical-align: middle;
	border-bottom: 1px solid var(--color-border);
}
.inventory-table :deep(tbody > tr:hover:not(.p-datatable-row-expansion)) {
	background: var(--color-bg);
}
.inventory-table :deep(.p-datatable-row-expansion > td) {
	padding: 0;
	border-bottom: 1px solid var(--color-border);
}

.group-header {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	width: 100%;
	padding: 0.5rem 0.75rem;
	font-size: 0.75rem;
	text-align: left;
}
.group-header:hover {
	background: var(--color-bg);
}

.spec-badge {
	font-size: 10px;
	color: var(--color-text-muted);
	border: 1px solid var(--color-border);
	border-radius: 3px;
	padding: 0.125rem 0.375rem;
}
</style>
