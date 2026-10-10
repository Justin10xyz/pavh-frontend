<template>
	<div class="p-2 max-w-4xl">
		<div class="mb-4">
			<h1 class="font-serif text-xl text-primary">{{ quoteId ? 'Convertir cotización a venta' : route.meta.title }}</h1>
			<p v-if="quoteId" class="text-sm text-text-muted mt-0.5">
				Revisa y ajusta los datos prellenados desde la
				<router-link :to="{ name: 'quotes.show', params: { id: quoteId } }" class="text-accent hover:underline">cotización de origen</router-link>.
			</p>
			<p v-else class="text-sm text-text-muted mt-0.5">Selecciona los productos, captura cantidades y ajusta el precio de venta si aplica.</p>
		</div>

		<div v-if="loadingConversion" class="text-text-muted text-sm">Cargando cotización…</div>

		<!-- Error bloqueante de /convert (cotización ya convertida, o variantes que
		     ya no están en inventario): aquí sí
		     se oculta el form a propósito, no hay nada que se pueda registrar. -->
		<div v-else-if="conversionError" class="space-y-3">
			<p class="text-danger text-[13px] flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
				<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				{{ conversionError }}
			</p>
			<router-link
				:to="{ name: 'quotes.show', params: { id: quoteId } }"
				class="inline-flex items-center bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none"
			>
				Volver a la cotización
			</router-link>
		</div>

		<form v-else @submit.prevent="handleSubmit" class="space-y-4">
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
						<ProductAutocomplete v-if="!row.variant" @select="(option) => selectVariantForRow(row, option)" />

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
									<label :for="`unit-price-${row.id}`" class="text-xs font-medium text-text-muted block">Precio unitario (m²)</label>
									<InputNumberCustom
										:id="`unit-price-${row.id}`"
										v-model="row.unit_price"
										:min="0"
										placeholder="$0.00"
										mode="currency"
										currency="MXN"
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
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/lib/axios'
import { useInventoryStore } from '@/stores/inventory'
import { useSalesStore } from '@/stores/sales'
import CustomerSearch from '@/components/widgets/autocompletes/CustomerSearch.vue'
import ProductAutocomplete from '@/components/widgets/autocompletes/ProductAutocomplete.vue'
import InputNumberCustom from '@/components/widgets/InputNumberCustom.vue'

const route = useRoute()
const router = useRouter()
const sales = useSalesStore()
const inventory = useInventoryStore()

const form = reactive({
	customer_id: '',
})

// Con ?quote_id= es "Convertir a venta": se prellena desde GET /quotes/{id}/convert
// y la confirmación pasa por el mismo POST /api/sales con quote_id en el payload.
// Sin él es venta directa de mostrador.
const quoteId = computed(() => route.query.quote_id ?? null)
const loadingConversion = ref(false)
const conversionError = ref(null)

async function loadConversion() {
	loadingConversion.value = true

	try {
		const { data } = await axios.get(`/api/quotes/${quoteId.value}/convert`)

		// /convert solo trae product_variant_id; la variante completa (color,
		// medida, stock…) se resuelve contra el inventario, con la misma forma
		// que emite ProductAutocomplete (ver también QuoteFormView@loadQuote).
		let inventoryIsFresh = false
		if (!inventory.initialized) {
			await inventory.fetchProducts()
			inventoryIsFresh = true
		}
		if (!inventory.initialized) {
			conversionError.value = inventory.error || 'No se pudieron cargar los productos.'
			return
		}

		const items = data.data.items ?? []
		let resolved = resolveConversionLines(items)

		// Respaldo: las variantes dadas de baja ya las rechaza el backend con 422.
		// Esto cubre una variante que existe en BD pero no en el inventory.products
		// cacheado (ej. creada después de cargar el store): se refresca el
		// inventario una sola vez (salvo que se acabe de cargar) y se reintenta.
		if (resolved.missingVariantIds.length > 0 && !inventoryIsFresh) {
			await inventory.fetchProducts()
			resolved = resolveConversionLines(items)
		}

		const { loadedLines, missingVariantIds } = resolved

		// Si aun así falta, se bloquea. Solo aquí el mensaje se arma en el
		// frontend, con el id porque /convert no trae más datos.
		if (missingVariantIds.length > 0) {
			const ids = missingVariantIds.map((id) => `#${id}`).join(', ')
			conversionError.value = missingVariantIds.length === 1
				? `La variante ${ids} de esta cotización ya no está disponible en inventario. No se puede convertir a venta.`
				: `Las variantes ${ids} de esta cotización ya no están disponibles en inventario. No se puede convertir a venta.`
			return
		}

		form.customer_id = data.data.customer_id ?? ''
		lines.value = loadedLines.length > 0 ? loadedLines : [createEmptyLine()]
	} catch (err) {
		console.error(err)
		// 422 de QuoteController@convert (cotización ya convertida, o variantes
		// dadas de baja): el mensaje ya viene listo y se muestra tal cual.
		conversionError.value = err.response?.status === 404
			? 'La cotización no existe.'
			: err.response?.data?.message || 'No se pudo cargar la cotización.'
	} finally {
		loadingConversion.value = false
	}
}

function resolveConversionLines(items) {
	const loadedLines = []
	const missingVariantIds = []

	for (const item of items) {
		const variant = findInventoryVariantWithLine(item.product_variant_id)
		if (!variant) {
			missingVariantIds.push(item.product_variant_id)
			continue
		}

		loadedLines.push({
			...createEmptyLine(),
			variant,
			quantity: Number(item.quantity),
			unit_price: Number(item.unit_price),
		})
	}

	return { loadedLines, missingVariantIds }
}

function findInventoryVariantWithLine(variantId) {
	for (const product of inventory.products) {
		const variant = product.variants?.find((v) => v.id === variantId)
		if (variant) return { ...variant, lineName: product.name }
	}
	return null
}

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
			...(quoteId.value ? { quote_id: Number(quoteId.value) } : {}),
			items: validLines.map((l) => ({
				product_variant_id: l.variant.id,
				quantity: l.quantity,
				unit_price: l.unit_price,
			})),
		}

		const sale = await sales.createSale(payload)
		syncInventoryStock(payload.items)

		// Una conversión no es flujo de mostrador repetido: se vuelve al detalle
		// de la cotización (que se refetchea al montar y ya mostrará "Convertida").
		if (quoteId.value) {
			router.push({ name: 'quotes.show', params: { id: quoteId.value } })
			return
		}

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

// Al final del script: con `immediate` corre en setup y necesita que lines,
// generalError, etc. ya estén declarados.
watch(quoteId, () => {
	conversionError.value = null
	generalError.value = null
	successMessage.value = null
	resetForm()
	if (quoteId.value) loadConversion()
}, { immediate: true })
</script>

<style scoped>

</style>
