<template>
	<div class="p-2 max-w-4xl">
		<div class="mb-4">
			<h1 class="font-serif text-xl text-primary">{{ route.meta.title }}</h1>
			<p class="text-sm text-text-muted mt-0.5">Selecciona los productos y captura las cantidades de la cotización.</p>
		</div>

		<div v-if="loadingQuote" class="text-text-muted text-sm">Cargando cotización…</div>

		<p v-if="generalError" class="text-danger text-[13px] mb-4 flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
			<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			{{ generalError }}
		</p>

		<form v-else @submit.prevent="handleSubmit" class="space-y-4">
			<!-- Sección 1 — Datos generales -->
			<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
				<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">Datos generales</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label for="customer_id" class="text-xs font-medium text-text-muted block">Cliente</label>
						<CustomerSearch id="customer_id" v-model="form.customer_id" />
					</div>

					<div class="space-y-1.5 sm:col-span-2">
						<label for="notes" class="text-xs font-medium text-text-muted block">Notas</label>
						<TextareaCustom
							id="notes"
							v-model="form.notes"
							rows="3"
							placeholder="Notas adicionales para esta cotización (opcional)"
						/>
					</div>
				</div>
			</div>

			<!-- Sección 2 — Líneas de producto -->
			<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
				<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">Productos</h2>

				<div class="space-y-3">
					<div v-for="(row, index) in lines" :key="row.id" class="border border-border rounded-md p-4">
						<div class="flex items-center justify-between mb-3">
							<span class="text-xs font-medium text-text-muted">Producto {{ index + 1 }}</span>
							<button
								type="button"
								@click="removeLine(row.id)"
								:disabled="lines.length === 1"
								class="text-text-muted hover:text-danger disabled:opacity-30 disabled:hover:text-text-muted disabled:cursor-not-allowed transition-colors"
								aria-label="Quitar producto"
								title="Quitar producto"
							>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M6 18L18 6" />
								</svg>
							</button>
						</div>

						<!-- Sin producto seleccionado: buscador -->
						<ProductAutocomplete
							v-if="!row.variant && !row.simpleProduct"
							include-simple-products
							@select="(option) => selectProductForRow(row, option)"
						/>

						<!-- Producto simple seleccionado -->
						<div v-else-if="row.simpleProduct">
							<div class="flex items-start justify-between gap-3 mb-3">
								<p class="text-sm text-text flex items-center gap-2">
									{{ simpleProductFor(row).name }}
									<span
										v-if="simpleProductCategoryName(row)"
										class="text-[10px] text-text-muted border border-border rounded px-1.5 py-0.5"
									>
										{{ simpleProductCategoryName(row) }}
									</span>
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

							<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
								<div class="space-y-1.5">
									<label :for="`quantity-${row.id}`" class="text-xs font-medium text-text-muted block">Cantidad (unidades)</label>
									<InputNumberCustom
										:id="`quantity-${row.id}`"
										v-model="row.quantity"
										:min="1"
										placeholder="0"
										:max-fraction-digits="0"
									/>
								</div>

								<div class="space-y-1.5">
									<label class="text-xs font-medium text-text-muted block">Precio unitario</label>
									<div class="h-[38px] flex items-center px-3 text-sm text-text-muted bg-bg border border-border rounded-md">
										{{ formatCurrency(simpleProductFor(row).price) }}
									</div>
								</div>

								<div class="space-y-1.5">
									<label class="text-xs font-medium text-text-muted block">Subtotal</label>
									<div class="h-[38px] flex items-center px-3 text-sm text-text font-medium bg-bg border border-border rounded-md">
										{{ formatCurrency(lineSubtotal(row)) }}
									</div>
								</div>
							</div>

							<p v-if="hasInsufficientStock(row)" class="text-danger text-[12px] mt-2">
								Stock insuficiente — consultar disponibilidad sobre pedido.
							</p>
						</div>

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
									<InputNumberCustom
										:id="`quantity-${row.id}`"
										v-model="row.quantity"
										:min="0.01"
										placeholder="0.00"
										:max-fraction-digits="2"
									/>
								</div>

								<div class="space-y-1.5">
									<label class="text-xs font-medium text-text-muted block">Equivalente</label>
									<div class="h-[38px] flex items-center px-3 text-sm text-text-muted bg-bg border border-border rounded-md">
										{{ boxesFor(row) ?? '—' }} cajas
									</div>
								</div>

								<div class="space-y-1.5">
									<label class="text-xs font-medium text-text-muted block">Precio unitario</label>
									<div class="h-[38px] flex items-center px-3 text-sm text-text-muted bg-bg border border-border rounded-md">
										{{ formatCurrency(row.variant.price_per_m2) }}
									</div>
								</div>

								<div class="space-y-1.5">
									<label class="text-xs font-medium text-text-muted block">Subtotal</label>
									<div class="h-[38px] flex items-center px-3 text-sm text-text font-medium bg-bg border border-border rounded-md">
										{{ formatCurrency(lineSubtotal(row)) }}
									</div>
								</div>
							</div>

							<p v-if="hasInsufficientStock(row)" class="text-danger text-[12px] mt-2">
								Stock insuficiente — consultar disponibilidad sobre pedido.
							</p>
						</div>
					</div>
				</div>

				<button
					type="button"
					@click="addLine"
					class="mt-3 w-full border border-dashed border-border rounded-md py-2 text-sm text-text-muted hover:text-text hover:border-accent transition-colors select-none cursor-pointer"
				>
					+ Agregar producto
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

			<!-- Acciones -->
			<div class="flex items-center justify-end gap-3">
				<button
					type="button"
					@click="handleCancel"
					class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="submit"
					:disabled="submitting"
					class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
				>
					{{ submitting ? 'Guardando…' : 'Guardar cotización' }}
				</button>
			</div>
		</form>
	</div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInventoryStore } from '@/stores/inventory'
import { useSimpleProductsStore } from '@/stores/simpleProducts'
import { useCatalogsStore } from '@/stores/catalogs'
import { useQuotesStore } from '@/stores/quotes'
import CustomerSearch from '@/components/widgets/autocompletes/CustomerSearch.vue'
import ProductAutocomplete from '@/components/widgets/autocompletes/ProductAutocomplete.vue'
import InputNumberCustom from '@/components/widgets/InputNumberCustom.vue'
import TextareaCustom from '@/components/widgets/TextareaCustom.vue'

const route = useRoute()
const router = useRouter()
const inventory = useInventoryStore()
const simpleProducts = useSimpleProductsStore()
const catalogs = useCatalogsStore()
const quotes = useQuotesStore()

// Modo edición cuando la ruta trae :id (quotes.edit); sin :id es creación.
const quoteId = computed(() => route.params.id ?? null)
const isEdit = computed(() => quoteId.value !== null)
const loadingQuote = ref(false)

onMounted(() => {
	// Las líneas existentes ya traen su variante en la respuesta del quote, pero
	// el buscador de "Cambiar" / "+ Agregar producto" sigue dependiendo del
	// inventario, así que se carga en ambos modos (cacheado vía `initialized`).
	// ProductAutocomplete también lo carga al montarse; el guard de `loading`
	// evita el request duplicado.
	if (!inventory.initialized && !inventory.loading) inventory.fetchProducts()
	// Mismo criterio para productos simples: precio y stock "en vivo" de las
	// líneas simples (y su categoría, vía catálogos) salen de estos stores, no de
	// la respuesta del quote, que solo trae id/name/price.
	if (!simpleProducts.initialized && !simpleProducts.loading) simpleProducts.fetchSimpleProducts()
	if (!catalogs.initialized && !catalogs.loading) catalogs.fetchCatalogs()
	if (isEdit.value) loadQuote()
})

async function loadQuote() {
	loadingQuote.value = true
	await quotes.fetchQuote(quoteId.value)
	loadingQuote.value = false

	const quote = quotes.currentQuote
	if (quotes.currentQuoteError || !quote || String(quote.id) !== String(quoteId.value)) {
		generalError.value = quotes.currentQuoteError || 'No se pudo cargar la cotización.'
		return
	}

	// El backend rechaza el PUT si no está en Borrador (guard real); esto solo
	// evita mostrar un form editable que de todos modos va a fallar.
	if (quote.status !== 'Borrador') {
		router.replace({ name: 'quotes.show', params: { id: quote.id } })
		return
	}

	form.customer_id = quote.customer_id ?? ''
	form.notes = quote.notes ?? ''

	// Se mapea product.name → lineName para que la variante tenga la misma
	// forma que las que emite ProductAutocomplete y el template no distinga entre modos.
	// Cada item trae variante O producto simple (arco exclusivo del backend).
	const loadedLines = (quote.items ?? []).map((item) => ({
		...createEmptyLine(),
		variant: item.product_variant
			? { ...item.product_variant, type: 'variant', lineName: item.product_variant.product?.name }
			: null,
		simpleProduct: item.simple_product ? { ...item.simple_product, type: 'simple' } : null,
		quantity: Number(item.quantity),
	}))
	lines.value = loadedLines.length > 0 ? loadedLines : [createEmptyLine()]
}

const form = reactive({
	customer_id: '',
	notes: '',
})

// Una línea lleva `variant` O `simpleProduct`, nunca ambos — refleja el arco
// exclusivo product_variant_id / simple_product_id del backend.
function createEmptyLine() {
	return {
		id: crypto.randomUUID(),
		variant: null,
		simpleProduct: null,
		quantity: null,
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
	row.simpleProduct = null
}

// Si el producto (variante o simple) ya existe en otra línea del form, se suma
// la cantidad nueva a esa línea existente en vez de duplicar la fila (ver
// AGENT.md — listas repetibles no deben permitir estado duplicado inconsistente).
// Los ids de variante y de producto simple son de tablas distintas, por eso se
// compara solo contra el campo del mismo tipo.
function selectProductForRow(row, option) {
	const isSimple = option.type === 'simple'
	const target = lines.value.find((l) =>
		isSimple ? l.simpleProduct?.id === option.id : l.variant?.id === option.id,
	)

	if (target) {
		target.quantity = (Number(target.quantity) || 0) + 1
		flashMerge(target.id)
		lines.value = lines.value.filter((l) => l.id !== row.id)
		if (lines.value.length === 0) lines.value.push(createEmptyLine())
		return
	}

	row.variant = isSimple ? null : option
	row.simpleProduct = isSimple ? option : null

	// Al "Cambiar" de una variante (m², fraccionaria) a un producto simple, una
	// cantidad no entera se descarta: el backend rechaza fraccionarios en simples.
	const keepsQuantity = row.quantity > 0 && (!isSimple || Number.isInteger(row.quantity))
	row.quantity = keepsQuantity ? row.quantity : 1
}

// Datos vivos del producto simple (precio, stock, categoría) desde el store; si
// no está ahí (ej. dado de baja después de cotizar), se usa lo que trae la línea.
function simpleProductFor(row) {
	return simpleProducts.simpleProducts.find((p) => p.id === row.simpleProduct.id) ?? row.simpleProduct
}

function simpleProductCategoryName(row) {
	const categoryId = simpleProductFor(row).category_id
	return catalogs.categories.find((c) => c.id === categoryId)?.name ?? ''
}

function boxesFor(row) {
	if (!row.variant?.m2_per_box) return null
	return Math.ceil((row.quantity || 0) / row.variant.m2_per_box)
}

function hasInsufficientStock(row) {
	if (row.simpleProduct) {
		const stock = simpleProductFor(row).stock_quantity
		if (stock === undefined) return false
		return (row.quantity || 0) > stock
	}

	const boxes = boxesFor(row)
	if (boxes === null) return false
	return boxes > (row.variant.stock_boxes ?? 0)
}

function lineSubtotal(row) {
	if (!row.quantity) return 0
	if (row.simpleProduct) return row.quantity * simpleProductFor(row).price
	if (row.variant) return row.quantity * row.variant.price_per_m2
	return 0
}

const subtotal = computed(() => lines.value.reduce((sum, row) => sum + lineSubtotal(row), 0))
const total = computed(() => subtotal.value) // sin impuestos por ahora, igual que el backend

const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function formatCurrency(value) {
	return currencyFormatter.format(Number(value) || 0)
}

const submitting = ref(false)
const generalError = ref(null)

const handleSubmit = async () => {
	generalError.value = null

	const validLines = lines.value.filter((l) => (l.variant || l.simpleProduct) && l.quantity > 0)
	if (validLines.length === 0) {
		generalError.value = 'Agrega al menos un producto con cantidad mayor a cero.'
		return
	}

	submitting.value = true

	try {
		const payload = {
			customer_id: form.customer_id || null,
			notes: form.notes || null,
			items: validLines.map((l) => (l.simpleProduct
				? { simple_product_id: l.simpleProduct.id, quantity: l.quantity }
				: { product_variant_id: l.variant.id, quantity: l.quantity })),
		}

		if (isEdit.value) {
			await quotes.updateQuote(quoteId.value, payload)
			router.push({ name: 'quotes.show', params: { id: quoteId.value } })
		} else {
			await quotes.createQuote(payload)
			router.push({ name: 'quotes' })
		}
	} catch (err) {
		console.error(err)
		generalError.value = err.response?.data?.message || 'No se pudo guardar la cotización. Intenta de nuevo.'
	} finally {
		submitting.value = false
	}
}

function handleCancel() {
	if (isEdit.value) router.push({ name: 'quotes.show', params: { id: quoteId.value } })
	else router.push({ name: 'quotes' })
}
</script>

<style scoped>

</style>
