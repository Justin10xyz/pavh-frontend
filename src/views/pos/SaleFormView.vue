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
									<label :for="`unit-price-${row.id}`" class="text-xs font-medium text-text-muted block">Precio unitario</label>
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
import { useSimpleProductsStore } from '@/stores/simpleProducts'
import { useCatalogsStore } from '@/stores/catalogs'
import { useSalesStore } from '@/stores/sales'
import CustomerSearch from '@/components/widgets/autocompletes/CustomerSearch.vue'
import ProductAutocomplete from '@/components/widgets/autocompletes/ProductAutocomplete.vue'
import InputNumberCustom from '@/components/widgets/InputNumberCustom.vue'

const route = useRoute()
const router = useRouter()
const sales = useSalesStore()
const inventory = useInventoryStore()
const simpleProducts = useSimpleProductsStore()
const catalogs = useCatalogsStore()

// Precio de lista, stock y categoría de las líneas simples salen de estos
// stores (cacheados vía `initialized`); ProductAutocomplete también los carga,
// el guard de `loading` evita el request duplicado.
if (!simpleProducts.initialized && !simpleProducts.loading) simpleProducts.fetchSimpleProducts()
if (!catalogs.initialized && !catalogs.loading) catalogs.fetchCatalogs()

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

		// /convert solo trae product_variant_id o simple_product_id (arco
		// exclusivo); el producto completo se resuelve contra su propio caché —
		// variantes contra inventory.products, simples contra simpleProducts —
		// con la misma forma que emite ProductAutocomplete (ver también
		// QuoteFormView@loadQuote). Cada store se carga solo si hay líneas de su tipo.
		const items = data.data.items ?? []
		const hasVariantItems = items.some((item) => item.product_variant_id)
		const hasSimpleItems = items.some((item) => item.simple_product_id)

		let inventoryIsFresh = false
		if (hasVariantItems && !inventory.initialized) {
			await inventory.fetchProducts()
			inventoryIsFresh = true
		}
		if (hasVariantItems && !inventory.initialized) {
			conversionError.value = inventory.error || 'No se pudieron cargar los productos.'
			return
		}

		let simpleProductsAreFresh = false
		if (hasSimpleItems && !simpleProducts.initialized) {
			await simpleProducts.fetchSimpleProducts()
			simpleProductsAreFresh = true
		}
		if (hasSimpleItems && !simpleProducts.initialized) {
			conversionError.value = simpleProducts.error || 'No se pudieron cargar los productos.'
			return
		}

		let resolved = resolveConversionLines(items)

		// Respaldo: los productos dados de baja ya los rechaza el backend con 422.
		// Esto cubre uno que existe en BD pero no en el caché (ej. creado después
		// de cargar el store): se refresca ese store una sola vez (salvo que se
		// acabe de cargar) y se reintenta.
		const refetches = []
		if (resolved.missingVariantIds.length > 0 && !inventoryIsFresh) refetches.push(inventory.fetchProducts())
		if (resolved.missingSimpleProductIds.length > 0 && !simpleProductsAreFresh) refetches.push(simpleProducts.fetchSimpleProducts())
		if (refetches.length > 0) {
			await Promise.all(refetches)
			resolved = resolveConversionLines(items)
		}

		const { loadedLines, missingVariantIds, missingSimpleProductIds } = resolved

		// Si aun así falta, se bloquea. Solo aquí el mensaje se arma en el
		// frontend, con el id porque /convert no trae más datos.
		if (missingVariantIds.length > 0 || missingSimpleProductIds.length > 0) {
			conversionError.value = missingProductsMessage(missingVariantIds, missingSimpleProductIds)
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
	const missingSimpleProductIds = []

	for (const item of items) {
		const line = {
			...createEmptyLine(),
			quantity: Number(item.quantity),
			unit_price: Number(item.unit_price),
		}

		if (item.simple_product_id) {
			const simpleProduct = findSimpleProduct(item.simple_product_id)
			if (!simpleProduct) {
				missingSimpleProductIds.push(item.simple_product_id)
				continue
			}
			line.simpleProduct = { ...simpleProduct, type: 'simple' }
		} else {
			const variant = findInventoryVariantWithLine(item.product_variant_id)
			if (!variant) {
				missingVariantIds.push(item.product_variant_id)
				continue
			}
			line.variant = { ...variant, type: 'variant' }
		}

		loadedLines.push(line)
	}

	return { loadedLines, missingVariantIds, missingSimpleProductIds }
}

function missingProductsMessage(variantIds, simpleProductIds) {
	const parts = []

	if (variantIds.length > 0) {
		const ids = variantIds.map((id) => `#${id}`).join(', ')
		parts.push(variantIds.length === 1 ? `la variante ${ids}` : `las variantes ${ids}`)
	}
	if (simpleProductIds.length > 0) {
		const ids = simpleProductIds.map((id) => `#${id}`).join(', ')
		parts.push(simpleProductIds.length === 1 ? `el producto ${ids}` : `los productos ${ids}`)
	}

	const plural = variantIds.length + simpleProductIds.length > 1
	const subject = parts.join(' y ')

	return `${subject.charAt(0).toUpperCase()}${subject.slice(1)} de esta cotización ya no ${plural ? 'están disponibles' : 'está disponible'} en inventario. No se puede convertir a venta.`
}

function findSimpleProduct(simpleProductId) {
	return simpleProducts.simpleProducts.find((p) => p.id === simpleProductId) ?? null
}

function findInventoryVariantWithLine(variantId) {
	for (const product of inventory.products) {
		const variant = product.variants?.find((v) => v.id === variantId)
		if (variant) return { ...variant, lineName: product.name }
	}
	return null
}

// Una línea lleva `variant` O `simpleProduct`, nunca ambos — refleja el arco
// exclusivo product_variant_id / simple_product_id del backend.
function createEmptyLine() {
	return {
		id: crypto.randomUUID(),
		variant: null,
		simpleProduct: null,
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
	row.simpleProduct = null
}

// Misma fusión que QuoteFormView: si el producto (variante o simple) ya está en
// otra línea se suma la cantidad ahí (conservando el precio que ya se haya
// capturado en esa línea) en vez de duplicar la fila. Los ids son de tablas
// distintas, por eso se compara solo contra el campo del mismo tipo.
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

	// En venta el backend sí acepta unit_price del cliente: se precarga con el
	// precio de lista (por m² o por unidad) como valor inicial editable.
	row.unit_price = Number(isSimple ? option.price : option.price_per_m2)
}

// Datos vivos del producto simple (stock, categoría) desde el store; si no
// está ahí, se usa lo que trae la línea.
function simpleProductFor(row) {
	return findSimpleProduct(row.simpleProduct.id) ?? row.simpleProduct
}

function simpleProductCategoryName(row) {
	const categoryId = simpleProductFor(row).category_id
	return catalogs.categories.find((c) => c.id === categoryId)?.name ?? ''
}

function boxesFor(row) {
	if (!row.variant?.m2_per_box) return null
	return Math.ceil((row.quantity || 0) / row.variant.m2_per_box)
}

// Solo UX: el guard real es hasSufficientStock() de ProductVariant/SimpleProduct
// en el backend.
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
	if (!(row.variant || row.simpleProduct) || !row.quantity || !row.unit_price) return 0
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
		if (!item.product_variant_id) continue
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

// Mismo criterio para productos simples, sin conversión de unidad: `quantity`
// ya es la unidad física (SaleController@store descuenta igual, agregando por
// producto). Sin store cargado no hay nada que sincronizar.
function syncSimpleProductsStock(items) {
	if (!simpleProducts.initialized) return

	const unitsByProduct = new Map()
	for (const item of items) {
		if (!item.simple_product_id) continue
		unitsByProduct.set(item.simple_product_id, (unitsByProduct.get(item.simple_product_id) ?? 0) + item.quantity)
	}

	for (const [productId, units] of unitsByProduct) {
		const product = findSimpleProduct(productId)
		if (!product) continue
		simpleProducts.updateSimpleProductStock(productId, { stock_quantity: Number(product.stock_quantity) - units })
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

	const validLines = lines.value.filter((l) => (l.variant || l.simpleProduct) && l.quantity > 0)
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
				...(l.simpleProduct ? { simple_product_id: l.simpleProduct.id } : { product_variant_id: l.variant.id }),
				quantity: l.quantity,
				unit_price: l.unit_price,
			})),
		}

		const sale = await sales.createSale(payload)
		syncInventoryStock(payload.items)
		syncSimpleProductsStock(payload.items)

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
		// 422 del backend (stock insuficiente, variante sin m2_per_box, cantidad
		// fraccionaria en un producto simple, o validación del Form Request) ya
		// trae un mensaje listo para mostrar.
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
