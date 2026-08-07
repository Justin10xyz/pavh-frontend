<template>
	<div class="p-2">
		<div class="flex items-center justify-between mb-4">
			<h1 class="font-serif text-xl text-primary">Inventario</h1>
			<RouterLink
				:to="{ name: 'products.create' }"
				class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors inline-flex items-center select-none"
			>
				Nuevo producto
			</RouterLink>
		</div>

		<div v-if="inventory.loading" class="text-text-muted text-sm">Cargando productos…</div>
		<div v-else-if="inventory.error" class="text-danger text-sm">{{ inventory.error }}</div>


		<template v-else>
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
					@click="clearFilters"
				>
					Limpiar filtros
				</button>
			</div>

			<div v-if="filteredProducts.length === 0" class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface">
				No se encontraron productos con esos filtros.
			</div>

			<div v-else class="bg-surface border border-border rounded-md overflow-hidden">
				<DataTable :value="filteredProducts" dataKey="id" v-model:expandedRows="expandedRows" class="inventory-table">
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
								<span class="text-[10px] text-text-muted border border-border rounded px-1.5 py-0.5">
									{{ data.category }} · {{ data.supplier }} · {{ data.unit_type }}
								</span>
							</div>
						</template>
					</Column>

					<Column header="Variantes" style="width: 8rem">
						<template #body="{ data }">
							<span class="text-text-muted">{{ visibleVariantsByProduct.get(data.id)?.length ?? 0 }}</span>
						</template>
					</Column>

					<template #expansion="{ data }">
						<div class="bg-bg px-4 py-2 space-y-1.5">
							<div
								v-for="group in groupVariants(visibleVariantsByProduct.get(data.id) ?? [])"
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
										{{ Number(group.m2_per_box).toFixed(2) }} m²/caja · {{ group.kilos_per_box }} kg/caja
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
		</template>
	</div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useInventoryStore } from '@/stores/inventory'
import { groupVariants } from '@/lib/groupVariants'

const inventory = useInventoryStore()

const expandedRows = ref({})
const expandedGroups = ref({})

const searchQuery = ref('')
const selectedCategory = ref('')
const lowStockOnly = ref(false)

onMounted(() => {
	if (!inventory.initialized) inventory.fetchProducts()
})

function normalize(str) {
	return (str ?? '')
		.toString()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
}

const categoryOptions = computed(() => {
	const set = new Set(inventory.products.map((p) => p.category).filter(Boolean))
	return Array.from(set).sort()
})

const hasActiveFilters = computed(
	() => searchQuery.value !== '' || selectedCategory.value !== '' || lowStockOnly.value
)

function clearFilters() {
	searchQuery.value = ''
	selectedCategory.value = ''
	lowStockOnly.value = false
}

// Variantes visibles por producto, ya aplicando stock bajo + búsqueda.
// Si el nombre del producto matchea la búsqueda, se conservan todas sus variantes;
// si no, solo las variantes cuyo color o código matchean.
const visibleVariantsByProduct = computed(() => {
	const map = new Map()
	const q = normalize(searchQuery.value)

	for (const product of inventory.products) {
		let variants = product.variants

		if (lowStockOnly.value) {
			variants = variants.filter((v) => v.low_stock)
		}

		if (q) {
			const productMatches = normalize(product.name).includes(q)
			if (!productMatches) {
				variants = variants.filter(
					(v) => normalize(v.color).includes(q) || normalize(v.code).includes(q)
				)
			}
		}

		map.set(product.id, variants)
	}

	return map
})

const filteredProducts = computed(() => {
	return inventory.products.filter((product) => {
		if (selectedCategory.value && product.category !== selectedCategory.value) return false
		const variants = visibleVariantsByProduct.value.get(product.id) ?? []
		return variants.length > 0
	})
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
