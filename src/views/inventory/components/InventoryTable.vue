<template>
	<div class="bg-surface border border-border rounded-md overflow-hidden">
		<DataTable
			:value="products"
			dataKey="id"
			v-model:expandedRows="expandedRows"
			class="inventory-table"
		>
			<Column header="Producto">
				<template #body="{ data, rowTogglerCallback }">
					<div class="flex items-center gap-2">
						<button
							type="button"
							class="toggle-btn cursor-pointer"
							:class="{ 'is-open': expandedRows[data.id] }"
							@click="rowTogglerCallback"
							:aria-label="expandedRows[data.id] ? 'Colapsar' : 'Expandir'"
						>
							<svg viewBox="0 0 8 8" width="8" height="8">
								<path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
							</svg>
						</button>
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
							<span class="font-semibold text-primary text-sm">{{ data.name }}</span>
							<span
								class="text-[0.6rem] text-text-muted border border-border rounded px-1.5 py-0.5"
							>
								{{ data.category }} · {{ data.supplier }} · {{ data.unit_type }}
							</span>
						</div>
					</div>
				</template>
			</Column>

			<Column header="Variantes" style="width: 6rem">
				<template #body="{ data }">
					<span class="text-text-muted">{{
						visibleVariantsByProduct.get(data.id)?.length ?? 0
					}}</span>
				</template>
			</Column>

			<template #expansion="{ data }">
				<div class="bg-bg px-2 sm:px-4 py-2 space-y-1.5">
					<div
						v-for="group in groupVariants(visibleVariantsByProduct.get(data.id) ?? [])"
						:key="group.key"
						class="border border-border rounded-md overflow-hidden bg-surface"
					>
						<div class="group-header">
							<button
								type="button"
								class="group-header-toggle cursor-pointer"
								@click="toggleGroup(data.id, group.key)"
								title="Clic para ver stock por color"
								:aria-label="
									isGroupExpanded(data.id, group.key)
										? 'Colapsar colores'
										: 'Expandir colores'
								"
							>
								<span
									class="toggle-btn"
									:class="{ 'is-open': isGroupExpanded(data.id, group.key) }"
								>
									<svg viewBox="0 0 8 8" width="8" height="8">
										<path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
									</svg>
								</span>
								<!-- Cada bloque envuelve como unidad: en lg+ cabe todo en una
								     línea; en tablet baja precio/specs a una segunda línea. -->
								<span class="flex-1 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
									<span class="flex items-center gap-2 whitespace-nowrap">
										<span class="font-medium text-text">{{ group.size }}</span>
										<span class="spec-badge">PEI {{ group.pei }}</span>
										<span class="spec-badge">ETT {{ group.ett }}</span>
										<span v-if="group.commission_category" class="spec-badge">{{
											group.commission_category.code
										}}</span>
									</span>
									<span class="flex items-center gap-2 whitespace-nowrap">
										<span class="font-semibold text-primary tabular-nums"
										>${{ Number(group.price_per_box).toFixed(2) }}/caja</span
										>
										<span class="font-semibold text-primary tabular-nums"
										>${{ Number(group.price_per_m2).toFixed(2) }}/m²</span
										>
									</span>
									<span class="text-text-muted">
										{{ group.pieces_per_box }} pzas/caja ·
										{{ Number(group.m2_per_box).toFixed(2) }} m²/caja ·
										{{ group.kilos_per_box }} kg/caja
									</span>
								</span>
								<span class="shrink-0 whitespace-nowrap text-text-muted"
								>{{ group.variants.length }} colores</span
								>
							</button>
							<button
								type="button"
								@click="emit('edit-product', data.id)"
								class="group-header-edit"
								aria-label="Editar producto"
								title="Editar producto"
							>
								<i class="ti ti-pencil"></i>
							</button>
						</div>

						<div v-if="isGroupExpanded(data.id, group.key)" class="overflow-x-auto">
							<table class="w-full text-xs border-t border-border">
								<thead>
									<tr class="text-text-muted uppercase text-[10px]">
										<th class="text-left font-medium py-1.5 pl-3 sm:pl-8">Color</th>
										<th class="hidden md:table-cell text-left font-medium py-1.5">Código</th>
										<th class="hidden sm:table-cell text-right font-medium py-1.5">Precio/caja</th>
										<th class="text-right font-medium py-1.5">Stock</th>
										<th class="text-center font-medium py-1.5 pr-3 sm:pr-6">Estado</th>
									</tr>
								</thead>
								<tbody>
									<tr
										v-for="variant in group.variants"
										:key="variant.id"
										class="border-t border-border hover:bg-bg/60 transition-colors"
									>
										<td class="py-1.5 pl-3 sm:pl-8 text-sm">
											{{ variant.color }}
											<!-- Sin columna Código por debajo de md: va debajo del color -->
											<span class="block md:hidden text-text-muted font-mono text-xs">{{
												variant.code
											}}</span>
										</td>
										<td class="hidden md:table-cell py-1.5 text-text-muted font-mono text-xs">
											{{ variant.code }}
										</td>
										<!-- Por debajo de sm se oculta: el precio por caja es parte de la
									     llave del grupo, así que ya está en el encabezado. -->
										<td
											class="hidden sm:table-cell py-1.5 font-semibold text-primary tabular-nums"
										>
											${{ Number(variant.price_per_box).toFixed(2) }}
										</td>
										<td
											class="py-1.5 text-sm"
											:class="
												variant.low_stock
													? 'text-danger font-medium'
													: 'text-text'
											"
										>
											{{ variant.stock_boxes }} cj
										</td>
										<td class="py-1.5 pr-3 sm:pr-6">
											<div class="flex items-center justify-start gap-1.5">
												<span
													class="text-[0.6rem] px-2 py-0.5 rounded"
													:class="
														variant.low_stock
															? 'bg-danger/10 text-danger'
															: 'bg-success/10 text-success'
													"
												>
													{{ variant.low_stock ? "Stock bajo" : "OK" }}
												</span>
												<div
													class="flex items-center justify-end gap-1.5 ml-auto"
												>
													<button
														type="button"
														@click="emit('open-stock-dialog', variant)"
														class="flex items-center p-1.5 lg:p-1 rounded text-text-muted hover:bg-bg hover:text-accent transition-colors cursor-pointer"
														aria-label="Ajustar stock"
														title="Ajustar stock"
													>
														<i
															class="ti ti-adjustments-horizontal text-base"
														></i>
													</button>
													<button
														type="button"
														@click="emit('open-movements-dialog', variant)"
														class="flex items-center p-1.5 lg:p-1 rounded text-text-muted hover:bg-bg hover:text-accent transition-colors cursor-pointer"
														aria-label="Ver historial de stock"
														title="Ver historial de stock"
													>
														<i class="ti ti-history text-base"></i>
													</button>
												</div>
											</div>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</template>
		</DataTable>
	</div>
</template>

<script setup>
import { ref } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { groupVariants } from "@/lib/groupVariants";

defineProps({
	products: {
		type: Array,
		required: true,
	},
	visibleVariantsByProduct: {
		type: Map,
		required: true,
	},
});

const emit = defineEmits(["edit-product", "open-stock-dialog", "open-movements-dialog"]);

const expandedRows = ref({});
const expandedGroups = ref({});

function groupExpansionKey(productId, groupKey) {
	return `${productId}::${groupKey}`;
}

function toggleGroup(productId, groupKey) {
	const key = groupExpansionKey(productId, groupKey);
	expandedGroups.value[key] = !expandedGroups.value[key];
}

function isGroupExpanded(productId, groupKey) {
	return !!expandedGroups.value[groupExpansionKey(productId, groupKey)];
}
</script>

<style scoped>
.toggle-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 1.25rem;
	height: 1.25rem;
	border-radius: 3px;
	color: var(--color-text-muted);
	flex-shrink: 0;
}
/* Área táctil más amplia para el toggle de la fila (tablet); compacto desde lg. */
button.toggle-btn {
	width: 2rem;
	height: 2rem;
}
@media (min-width: 64rem) {
	button.toggle-btn {
		width: 1.25rem;
		height: 1.25rem;
	}
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
	padding: 0.375rem 0.75rem;
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
	align-items: stretch;
}
.group-header:hover {
	background: var(--color-bg);
}

.group-header-toggle {
	display: flex;
	align-items: flex-start;
	gap: 0.5rem;
	flex: 1;
	min-width: 0;
	padding: 0.5rem 0.75rem;
	font-size: 0.75rem;
	text-align: left;
}

.group-header-edit {
	display: flex;
	align-items: center;
	align-self: center;
	flex-shrink: 0;
	margin-right: 0.5rem;
	padding: 0.375rem;
	border-radius: 0.25rem;
	color: var(--color-text-muted);
	transition:
		color 150ms ease,
		background-color 150ms ease;
}
@media (min-width: 64rem) {
	.group-header-edit {
		padding: 0.25rem;
	}
	.group-header-toggle {
		align-items: center;
	}
}
.group-header-edit:hover {
	background: var(--color-border);
	color: var(--color-accent);
}

.spec-badge {
	font-size: 10px;
	font-weight: 400;
	color: var(--color-text-muted);
	border: 1px solid var(--color-border);
	border-radius: 3px;
	padding: 0.125rem 0.375rem;
}
</style>
