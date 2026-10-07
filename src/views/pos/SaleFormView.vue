<template>
	<div class="p-2 max-w-4xl">
		<div class="mb-4">
			<h1 class="font-serif text-xl text-primary">{{ route.meta.title }}</h1>
			<p class="text-sm text-text-muted mt-0.5">Selecciona los productos, captura cantidades y ajusta el precio de venta si aplica.</p>
		</div>

		<form @submit.prevent="handleSubmit" class="space-y-4">
			<!-- Sección 1 — Cliente -->
			<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
				<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">Cliente</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label for="customer_id" class="text-xs font-medium text-text-muted block">Cliente</label>
						<CustomerSearch id="customer_id" v-model="form.customer_id" />
					</div>
				</div>
			</div>

			<!-- Sección 2 — Líneas de venta -->
			<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
				<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">Productos</h2>

				<div class="space-y-3">
					<div v-for="(row, index) in lines" :key="row.id" class="border border-border rounded-md p-4">
						<div class="flex items-center justify-between mb-3">
							<span class="text-xs font-medium text-text-muted">Línea {{ index + 1 }}</span>
							<button
								type="button"
								@click="removeLine(row.id)"
								:disabled="lines.length === 1"
								class="text-text-muted hover:text-danger disabled:opacity-30 disabled:hover:text-text-muted disabled:cursor-not-allowed transition-colors"
								aria-label="Quitar línea"
								title="Quitar línea"
							>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M6 18L18 6" />
								</svg>
							</button>
						</div>

						<!-- Sin variante seleccionada: buscador -->
						<VariantAutocomplete v-if="!row.variant" @select="(option) => selectVariantForRow(row, option)" />

						<!-- Variante seleccionada -->
						<div v-else>
							<div class="flex items-start justify-between gap-3 mb-3">
								<p class="text-sm text-text">
									{{ row.variant.lineName }} — {{ row.variant.color }} — {{ row.variant.size }}
								</p>
								<button
									type="button"
									@click="changeLine(row)"
									class="text-xs text-accent hover:underline flex-shrink-0 cursor-pointer"
								>
									Cambiar
								</button>
							</div>

							<p v-if="mergedRowId === row.id" class="text-xs text-success mb-3">
								Cantidad fusionada con esta línea existente.
							</p>

							<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
								<div class="space-y-1.5">
									<label :for="`quantity-${row.id}`" class="text-xs font-medium text-text-muted block">Cantidad (m²)</label>
									<input
										:id="`quantity-${row.id}`"
										v-model.number="row.quantity"
										type="number"
										min="0.01"
										step="0.01"
										placeholder="0.00"
										class="w-full bg-surface border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors px-3 h-[38px] rounded-md"
									/>
								</div>

								<div class="space-y-1.5">
									<label class="text-xs font-medium text-text-muted block">Equivalente</label>
									<div class="h-[38px] flex items-center px-3 text-sm text-text-muted bg-bg border border-border rounded-md">
										{{ boxesFor(row) ?? '—' }} cajas
									</div>
								</div>

								<div class="space-y-1.5">
									<label :for="`unit-price-${row.id}`" class="text-xs font-medium text-text-muted block">Precio unitario (m²)</label>
									<input
										:id="`unit-price-${row.id}`"
										v-model.number="row.unit_price"
										type="number"
										min="0"
										step="0.01"
										placeholder="0.00"
										class="w-full bg-surface border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors px-3 h-[38px] rounded-md"
									/>
								</div>

								<div class="space-y-1.5">
									<label class="text-xs font-medium text-text-muted block">Subtotal</label>
									<div class="h-[38px] flex items-center px-3 text-sm text-text font-medium bg-bg border border-border rounded-md">
										{{ formatCurrency(lineSubtotal(row)) }}
									</div>
								</div>
							</div>

							<p v-if="hasInsufficientStock(row)" class="text-danger text-[12px] mt-2">
								Stock insuficiente — la venta no podrá registrarse con esta cantidad.
							</p>
						</div>
					</div>
				</div>

				<button
					type="button"
					@click="addLine"
					class="mt-3 w-full border border-dashed border-border rounded-md py-2 text-sm text-text-muted hover:text-text hover:border-accent transition-colors select-none cursor-pointer"
				>
					+ Agregar línea
				</button>

				<div class="flex justify-end mt-5 pt-4 border-t border-border">
					<div class="w-full sm:w-64 space-y-1.5">
						<div class="flex items-center justify-between text-sm">
							<span class="text-text-muted">Subtotal</span>
							<span class="text-text">{{ formatCurrency(subtotal) }}</span>
						</div>
						<div class="flex items-center justify-between text-sm font-medium">
							<span class="text-text">Total</span>
							<span class="text-text">{{ formatCurrency(total) }}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Mensajes: fuera de cualquier v-if/v-else del form para no ocultarlo -->
			<p v-if="generalError" class="text-danger text-[13px] flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
				<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				{{ generalError }}
			</p>

			<p v-if="successMessage" class="text-success text-[13px] flex items-center gap-1.5 bg-success/10 border border-success/20 rounded-md px-3 py-2">
				<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
				{{ successMessage }}
			</p>

			<!-- Acciones -->
			<div class="flex items-center justify-end gap-3">
				<button
					type="submit"
					:disabled="submitting"
					class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
				>
					{{ submitting ? 'Registrando…' : 'Registrar venta' }}
				</button>
			</div>
		</form>
	</div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useInventoryStore } from '@/stores/inventory'
import { useSalesStore } from '@/stores/sales'
import CustomerSearch from '@/components/widgets/autocompletes/CustomerSearch.vue'
import VariantAutocomplete from '@/components/widgets/autocompletes/VariantAutocomplete.vue'

const route = useRoute()
const sales = useSalesStore()
const inventory = useInventoryStore()

const form = reactive({
	customer_id: '',
})

function createEmptyLine() {
	return {
		id: crypto.randomUUID(),
		variant: null,
		quantity: null,
		unit_price: null,
	}
}

const lines = ref([createEmptyLine()])
const mergedRowId = ref(null)
let mergeTimeoutHandle = null

function flashMerge(id) {
	mergedRowId.value = id
	clearTimeout(mergeTimeoutHandle)
	mergeTimeoutHandle = setTimeout(() => {
		mergedRowId.value = null
	}, 2500)
}

function addLine() {
	lines.value.push(createEmptyLine())
}

function removeLine(id) {
	if (lines.value.length === 1) return
	lines.value = lines.value.filter((l) => l.id !== id)
}

function changeLine(row) {
	row.variant = null
}

// Misma fusión que QuoteFormView: si la variante ya está en otra línea se suma
// la cantidad ahí (conservando el precio que ya se haya capturado en esa línea)
// en vez de duplicar la fila.
function selectVariantForRow(row, option) {
	const target = lines.value.find((l) => l.variant?.id === option.id)

	if (target) {
		target.quantity = (Number(target.quantity) || 0) + 1
		flashMerge(target.id)
		lines.value = lines.value.filter((l) => l.id !== row.id)
		if (lines.value.length === 0) lines.value.push(createEmptyLine())
	} else {
		row.variant = option
		row.quantity = row.quantity && row.quantity > 0 ? row.quantity : 1
		// En venta directa el backend sí acepta unit_price del cliente: se
		// precarga con el precio de lista como valor inicial editable.
		row.unit_price = Number(option.price_per_m2)
	}
}

function boxesFor(row) {
	if (!row.variant?.m2_per_box) return null
	return Math.ceil((row.quantity || 0) / row.variant.m2_per_box)
}

// Solo UX: el guard real es ProductVariant::hasSufficientStock() en el backend.
function hasInsufficientStock(row) {
	const boxes = boxesFor(row)
	if (boxes === null) return false
	return boxes > (row.variant.stock_boxes ?? 0)
}

function lineSubtotal(row) {
	if (!row.variant || !row.quantity || !row.unit_price) return 0
	return row.quantity * row.unit_price
}

const subtotal = computed(() => lines.value.reduce((sum, row) => sum + lineSubtotal(row), 0))
const total = computed(() => subtotal.value) // sin impuestos por ahora, igual que Cotizaciones

const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function formatCurrency(value) {
	return currencyFormatter.format(Number(value) || 0)
}

const submitting = ref(false)
const generalError = ref(null)
const successMessage = ref(null)

// SaleResource no regresa el stock restante: se recalcula localmente con el
// mismo criterio que SaleController@store (ceil(m² / m2_per_box), sumado por
// variante) y la misma regla de low_stock que ProductVariantResource. Si el
// inventario no está cargado no hay nada que sincronizar.
function syncInventoryStock(items) {
	if (!inventory.initialized) return

	const boxesNeededByVariant = new Map()
	const variantsById = new Map()

	for (const item of items) {
		const variant = findInventoryVariant(item.product_variant_id)
		if (!variant?.m2_per_box) continue

		variantsById.set(variant.id, variant)
		const boxesNeeded = Math.ceil(item.quantity / Number(variant.m2_per_box))
		boxesNeededByVariant.set(variant.id, (boxesNeededByVariant.get(variant.id) ?? 0) + boxesNeeded)
	}

	for (const [variantId, boxesNeeded] of boxesNeededByVariant) {
		const variant = variantsById.get(variantId)
		const stockBoxes = Number(variant.stock_boxes) - boxesNeeded
		const lowStock = variant.minimum_stock !== null && stockBoxes <= variant.minimum_stock

		inventory.updateVariantStock(variantId, { stock_boxes: stockBoxes, low_stock: lowStock })
	}
}

function findInventoryVariant(variantId) {
	for (const product of inventory.products) {
		const variant = product.variants?.find((v) => v.id === variantId)
		if (variant) return variant
	}
	return null
}

function resetForm() {
	form.customer_id = ''
	lines.value = [createEmptyLine()]
	mergedRowId.value = null
}

const handleSubmit = async () => {
	generalError.value = null
	successMessage.value = null

	const validLines = lines.value.filter((l) => l.variant && l.quantity > 0)
	if (validLines.length === 0) {
		generalError.value = 'Agrega al menos un producto con cantidad mayor a cero.'
		return
	}

	submitting.value = true

	try {
		const payload = {
			customer_id: form.customer_id || null,
			items: validLines.map((l) => ({
				product_variant_id: l.variant.id,
				quantity: l.quantity,
				unit_price: l.unit_price,
			})),
		}

		const sale = await sales.createSale(payload)
		syncInventoryStock(payload.items)
		resetForm()
		successMessage.value = `Venta ${sale.folio} registrada correctamente.`
	} catch (err) {
		console.error(err)
		// 422 del backend (stock insuficiente, variante sin m2_per_box, o
		// validación del Form Request) ya trae un mensaje listo para mostrar.
		generalError.value = err.response?.data?.message || 'No se pudo registrar la venta. Intenta de nuevo.'
	} finally {
		submitting.value = false
	}
}
</script>

<style scoped>

</style>
