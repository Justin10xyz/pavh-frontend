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
			<p class="text-danger text-sm flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
				<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				{{ conversionError }}
			</p>
			<router-link
				:to="{ name: 'quotes.show', params: { id: quoteId } }"
				class="inline-flex items-center bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none"
			>
				Volver a la cotización
			</router-link>
		</div>

		<form v-else @submit.prevent="handleSubmit" class="space-y-4">
			<!-- Sección 1 — Cliente -->
			<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
				<h2 class="text-xs font-medium uppercase tracking-wide text-text-muted mb-4">Cliente</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<FieldLabel html-for="customer_id" text="Cliente" />
						<CustomerSearch id="customer_id" v-model="form.customer_id" />
					</div>
				</div>
			</div>

			<!-- Sección 2 — Líneas de venta -->
			<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
				<h2 class="text-xs font-medium uppercase tracking-wide text-text-muted mb-4">Productos</h2>

				<!-- Tabla compacta (mismo patrón que los colores en ProductFormView):
				     encabezado una vez y una fila delgada por producto. Por debajo de sm
				     cada fila apila sus campos con su label visible; desde sm los labels
				     pasan a sr-only y el encabezado toma su lugar. Header y filas comparten
				     el mismo grid + hueco del botón para alinear. `relative`: los labels
				     sr-only son absolute y sin ancestro posicionado escapan del scroll. -->
				<div class="relative border border-border rounded-md">
					<div
						class="hidden sm:flex items-center gap-2 bg-bg border-b border-border rounded-t-md px-3 py-2"
						aria-hidden="true"
					>
						<div
							class="flex-1 grid grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))] gap-3 text-xs font-medium uppercase tracking-wide text-text-muted"
						>
							<span>Producto<span class="text-danger ml-0.5">*</span></span>
							<span>m² requeridos</span>
							<span>Cantidad<span class="text-danger ml-0.5">*</span></span>
							<!-- normal-case: el uppercase del encabezado convertiría m² en M² -->
							<span>Precio unitario<span class="normal-case">/m²</span><span class="text-danger ml-0.5">*</span></span>
							<span class="text-right">Subtotal</span>
						</div>
						<span class="w-8 shrink-0"></span>
					</div>

					<div class="divide-y divide-border">
						<div v-for="(row, index) in lines" :key="row.id" class="px-3 py-3 sm:py-2">
							<div class="flex items-start gap-2">
								<!-- Sin producto elegido: el buscador ocupa toda la fila -->
								<div v-if="!hasProduct(row)" class="flex-1 min-w-0 space-y-1.5 sm:space-y-0">
									<label
										:for="`product-${row.id}`"
										class="text-xs font-medium text-text-muted block sm:sr-only"
									>
										Producto {{ index + 1 }}
									</label>
									<ProductAutocomplete
										:input-id="`product-${row.id}`"
										include-simple-products
										@select="(option) => selectProductForRow(row, option)"
									/>
								</div>

								<div
									v-else
									class="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))] gap-3"
								>
									<!-- Producto: nombre + detalle en dos renglones, "Cambiar" en línea -->
									<div class="min-w-0 sm:min-h-[2.375rem] flex flex-col justify-center">
										<template v-if="row.simpleProduct">
											<p class="text-sm font-medium text-text truncate" :title="simpleProductFor(row).name">
												{{ simpleProductFor(row).name }}
											</p>
											<p class="text-xs text-text-muted flex items-center gap-2">
												<span
													v-if="simpleProductCategoryName(row)"
													class="border border-border rounded px-1.5"
												>
													{{ simpleProductCategoryName(row) }}
												</span>
												<button
													type="button"
													@click="changeLine(row)"
													class="text-accent hover:underline cursor-pointer"
												>
													Cambiar
												</button>
											</p>
										</template>
										<template v-else>
											<p class="text-sm font-medium text-text truncate" :title="row.variant.lineName">
												{{ row.variant.lineName }}
											</p>
											<p class="text-xs text-text-muted flex items-center gap-2 min-w-0">
												<span class="truncate">{{ row.variant.color }} · {{ row.variant.size }}</span>
												<button
													type="button"
													@click="changeLine(row)"
													class="text-accent hover:underline shrink-0 cursor-pointer"
												>
													Cambiar
												</button>
											</p>
										</template>
										<p v-if="mergedRowId === row.id" class="text-xs text-success mt-0.5">
											Cantidad fusionada con esta línea existente.
										</p>
										<p v-if="boxConversionError(row)" class="text-danger text-xs mt-0.5">
											{{ boxConversionError(row) }}
										</p>
									</div>

									<!-- m² que pide el cliente (opcional, solo variantes): sugieren las
									     cajas con ceil. No se envían al backend: la cantidad real son las
									     cajas, que se pueden ajustar después (ej. una de más por merma). -->
									<div v-if="row.variant" class="space-y-1.5 sm:space-y-0">
										<FieldLabel
											:html-for="`requested-${row.id}`"
											text="m² requeridos"
											class="sm:sr-only"
										/>
										<InputNumberCustom
											:id="`requested-${row.id}`"
											:model-value="row.requestedM2"
											:min="0"
											placeholder="Opcional"
											suffix=" m²"
											:max-fraction-digits="2"
											:disabled="!row.variant.m2_per_box"
											@update:model-value="(value) => applyRequestedM2(row, value)"
										/>
									</div>
									<div v-else class="hidden sm:block" aria-hidden="true"></div>

									<!-- Cantidad en la unidad física de stock: cajas completas (variante) o
									     unidades (simple). En variantes, debajo los m² que cubren esas cajas. -->
									<div class="space-y-1.5 sm:space-y-0">
										<FieldLabel
											:html-for="`quantity-${row.id}`"
											:text="row.variant ? 'Cajas' : 'Cantidad (unidades)'"
											required
											class="sm:sr-only"
										/>
										<InputNumberCustom
											v-if="row.variant"
											:id="`quantity-${row.id}`"
											v-model="row.quantity"
											:min="1"
											placeholder="0 cj"
											suffix=" cj"
											:max-fraction-digits="0"
											:error="quantityError(row)"
										/>
										<InputNumberCustom
											v-else
											:id="`quantity-${row.id}`"
											v-model="row.quantity"
											:min="1"
											placeholder="0 uds."
											suffix=" uds."
											:max-fraction-digits="0"
											:error="quantityError(row)"
										/>
										<p v-if="quantityError(row)" class="text-danger text-xs mt-1.5">{{ quantityError(row) }}</p>
										<p
											v-else-if="row.variant && coveredM2(row) !== null"
											class="text-xs mt-1 tabular-nums"
											:class="coversRequested(row) ? 'text-text-muted' : 'text-amber-700'"
										>
											{{ formatQuantity(coveredM2(row)) }} m²<template v-if="!coversRequested(row)">
												· no cubre {{ formatQuantity(row.requestedM2) }}</template>
										</p>
									</div>

									<div class="space-y-1.5 sm:space-y-0">
										<FieldLabel
											:html-for="`unit-price-${row.id}`"
											:text="row.variant ? 'Precio unitario (m²)' : 'Precio unitario'"
											required
											class="sm:sr-only"
										/>
										<InputNumberCustom
											:id="`unit-price-${row.id}`"
											v-model="row.unit_price"
											:min="0"
											placeholder="$0.00"
											mode="currency"
											currency="MXN"
											:error="priceError(row)"
										/>
										<p v-if="priceError(row)" class="text-danger text-xs mt-1.5">{{ priceError(row) }}</p>
										<template v-else>
											<!-- Lo que vale cada caja al precio capturado -->
											<p v-if="boxPrice(row) !== null" class="text-xs text-text-muted mt-1 tabular-nums">
												{{ formatCurrency(boxPrice(row)) }}/caja
											</p>
											<!-- Referencia solo si el precio se ajustó: hace visible un descuento
											     o un error de dedo antes de registrar -->
											<p v-if="priceDiffersFromList(row)" class="text-xs text-text-muted mt-0.5 tabular-nums">
												Lista: {{ formatCurrency(listPrice(row)) }}{{ row.variant ? '/m²' : '' }}
											</p>
										</template>
									</div>

									<div class="space-y-1.5 sm:space-y-0">
										<span class="text-xs font-medium text-text-muted block sm:sr-only">Subtotal</span>
										<p class="sm:h-[2.375rem] flex items-center sm:justify-end text-sm font-medium text-text tabular-nums">
											{{ formatCurrency(lineSubtotal(row)) }}
										</p>
									</div>
								</div>

								<!-- Mismo alto que los inputs para quedar centrado con ellos desde sm -->
								<button
									type="button"
									@click="removeLine(row.id)"
									:disabled="lines.length === 1"
									class="w-8 h-[2.375rem] shrink-0 flex items-center justify-center rounded text-text-muted hover:text-danger disabled:opacity-30 disabled:hover:text-text-muted disabled:cursor-not-allowed transition-colors cursor-pointer"
									aria-label="Quitar producto"
									title="Quitar producto"
								>
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M6 18L18 6" />
									</svg>
								</button>
							</div>

								<!-- danger, no amber como en Cotizaciones: aquí el backend sí rechaza la venta -->
							<p
								v-if="hasProduct(row) && hasInsufficientStock(row)"
								class="mt-2 sm:mr-10 flex items-start gap-1.5 text-xs text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2"
							>
								<i class="ti ti-alert-triangle text-sm leading-none" aria-hidden="true"></i>
								<span>{{ stockError(row) }}</span>
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

			<!-- Barra fija al fondo: con varias líneas, total y acciones quedan a la
			     vista sin bajar hasta el final del form (relevante en tablet de
			     mostrador). El error de registro va aquí, junto a las acciones.
			     z-[1]: encima de las filas, pero debajo del dropdown del buscador (z-10). -->
			<div class="sticky bottom-0 z-[1] space-y-3 bg-surface border border-border rounded-md px-4 py-3">
				<p v-if="generalError" role="alert" class="text-danger text-sm flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
					<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
					{{ generalError }}
				</p>

				<div class="flex flex-wrap items-center justify-between gap-3">
					<p class="text-sm text-text-muted" aria-live="polite">
						{{ productCount }} {{ productCount === 1 ? 'producto' : 'productos' }}
						<span aria-hidden="true">·</span>
						Total <span class="font-semibold text-primary tabular-nums">{{ formatCurrency(total) }}</span>
					</p>

					<div class="flex items-center gap-3">
						<!-- Conversión: volver a la cotización (pasa por la confirmación de
						     salida si hay cambios). Venta directa: limpiar para empezar otra. -->
						<RouterLink
							v-if="quoteId"
							:to="{ name: 'quotes.show', params: { id: quoteId } }"
							class="inline-flex items-center bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none"
						>
							Cancelar
						</RouterLink>
						<button
							v-else
							type="button"
							:disabled="!isDirty"
							@click="requestClear"
							class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer disabled:opacity-50 disabled:hover:bg-surface disabled:cursor-not-allowed"
						>
							Limpiar
						</button>
						<button
							type="submit"
							:disabled="submitting"
							class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
						>
							{{ submitting ? 'Registrando…' : 'Registrar venta' }}
						</button>
					</div>
				</div>
			</div>
		</form>

		<ConfirmDialog :pt="{ mask: { class: 'bg-primary/50' } }">
			<template #container="{ message, acceptCallback, rejectCallback }">
				<div class="bg-surface border border-border rounded-md p-5 w-[380px] max-w-[90vw]">
					<h3 class="font-serif text-base text-primary mb-2">{{ message.header }}</h3>
					<p class="text-sm text-text-muted mb-5">{{ message.message }}</p>
					<div class="flex items-center justify-end gap-3">
						<button
							type="button"
							@click="rejectCallback"
							class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
						>
							Seguir editando
						</button>
						<button
							type="button"
							@click="acceptCallback"
							class="bg-danger hover:bg-danger/90 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
						>
							Descartar venta
						</button>
					</div>
				</div>
			</template>
		</ConfirmDialog>
	</div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import axios from '@/lib/axios'
import { useInventoryStore } from '@/stores/inventory'
import { useSimpleProductsStore } from '@/stores/simpleProducts'
import { useCatalogsStore } from '@/stores/catalogs'
import { useSalesStore } from '@/stores/sales'
import { useQuotesStore } from '@/stores/quotes'
import CustomerSearch from '@/components/widgets/autocompletes/CustomerSearch.vue'
import ProductAutocomplete from '@/components/widgets/autocompletes/ProductAutocomplete.vue'
import InputNumberCustom from '@/components/widgets/InputNumberCustom.vue'
import FieldLabel from '@/components/widgets/labels/FieldLabel.vue'
import { useNotify } from '@/composables/useNotify'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatQuantity } from '@/lib/formatQuantity'
import { boxesForSquareMeters, squareMetersForBoxes } from '@/lib/boxes'

const route = useRoute()
const router = useRouter()
const sales = useSalesStore()
const quotes = useQuotesStore()
const inventory = useInventoryStore()
const simpleProducts = useSimpleProductsStore()
const catalogs = useCatalogsStore()
const notify = useNotify()
const confirm = useConfirm()

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
		// Lo prellenado desde la cotización no cuenta como cambio; solo lo que
		// se ajuste después.
		savedSnapshot.value = serializeForm()
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
			// Variante: las cajas cotizadas (null en líneas previas al cambio a
			// cajas sin m2_per_box; se piden al registrar). Simple: unidades.
			quantity: item.product_variant_id ? item.boxes : Number(item.quantity),
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
		// Unidad física de stock: cajas completas (variante) o unidades (simple).
		// `requestedM2` es solo ayuda de captura para variantes; no se envía.
		quantity: null,
		requestedM2: null,
		unit_price: null,
	}
}

const lines = ref([createEmptyLine()])

// Cambios sin registrar (mismo patrón que QuoteFormView): se compara contra una
// foto del form tomada al iniciar, al terminar de prellenar una conversión y
// al limpiar tras registrar. Solo cuenta lo que se envía al backend; una línea
// vacía agregada y sin usar no es un cambio.
function serializeForm() {
	return JSON.stringify({
		customer_id: form.customer_id || null,
		lines: lines.value
			.filter((l) => l.variant || l.simpleProduct)
			.map((l) => [l.variant?.id ?? null, l.simpleProduct?.id ?? null, l.quantity ?? null, l.unit_price ?? null]),
	})
}

const savedSnapshot = ref(serializeForm())
const isDirty = computed(() => serializeForm() !== savedSnapshot.value)
// Tras registrar se navega al detalle de la venta sin pasar por la confirmación.
let skipLeaveGuard = false

function confirmDiscard() {
	if (skipLeaveGuard || !isDirty.value) return true

	return new Promise((resolve) => {
		confirm.require({
			header: 'Descartar venta',
			message: 'Hay una venta capturada sin registrar. Si sales ahora, se perderá.',
			accept: () => resolve(true),
			reject: () => resolve(false),
			onHide: () => resolve(false),
		})
	})
}

onBeforeRouteLeave(confirmDiscard)
// Mismo componente con otro query (ej. de "Convertir a venta" a "Nueva venta"
// desde el sidebar): no es un leave, pero el watch de quoteId limpia el form.
onBeforeRouteUpdate(confirmDiscard)

// Cerrar/recargar la pestaña no pasa por el router: el navegador muestra su
// propio aviso genérico (no se puede personalizar el texto).
function handleBeforeUnload(event) {
	if (!isDirty.value) return
	event.preventDefault()
	event.returnValue = ''
}

window.addEventListener('beforeunload', handleBeforeUnload)
onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload))
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

// Sin mouse: tras elegir un producto el foco pasa a su cantidad. En una variante
// nueva va a "m² requeridos" (el cliente suele pedir en m² y de ahí salen las
// cajas); en una fusión, a las cajas/unidades que acaban de sumar uno.
async function focusLineQuantity(row, { merged = false } = {}) {
	await nextTick()
	const field = !merged && row.variant && Number(row.variant.m2_per_box) > 0 ? 'requested' : 'quantity'
	const input = document.getElementById(`${field}-${row.id}`)
	input?.focus()
	input?.select()
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
		focusLineQuantity(target, { merged: true })
		return
	}

	row.variant = isSimple ? null : option
	row.simpleProduct = isSimple ? option : null

	// Cajas y unidades son enteras: al "Cambiar" se conserva la cantidad. Los m²
	// requeridos solo aplican a variantes; con otra variante (otro m² por caja)
	// se recalculan las cajas.
	row.quantity = row.quantity > 0 ? row.quantity : 1
	if (isSimple) row.requestedM2 = null
	else if (row.requestedM2 > 0) applyRequestedM2(row, row.requestedM2)

	// En venta el backend sí acepta unit_price del cliente: se precarga con el
	// precio de lista (por m² o por unidad) como valor inicial editable.
	row.unit_price = Number(isSimple ? option.price : option.price_per_m2)

	focusLineQuantity(row)
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

// La cantidad de una línea de variante son sus cajas (row.quantity); estos son
// los m² que cubren, sobre los que se cobra el precio por m².
function coveredM2(row) {
	return squareMetersForBoxes(row.quantity || 0, row.variant?.m2_per_box)
}

// Solo UX: las cajas se pueden bajar a mano por debajo de lo requerido, y se avisa.
function coversRequested(row) {
	if (!(row.requestedM2 > 0)) return true
	const covered = coveredM2(row)
	return covered === null || covered >= row.requestedM2
}

// Los m² requeridos sugieren las cajas (hacia arriba); borrarlos no toca las
// cajas ya capturadas.
function applyRequestedM2(row, value) {
	row.requestedM2 = value
	const boxes = value > 0 ? boxesForSquareMeters(value, row.variant?.m2_per_box) : null
	if (boxes) row.quantity = boxes
}

// Sin m2_per_box no se sabe qué cubren las cajas: el backend rechaza la línea
// (nunca asume 1:1). Se avisa desde que se elige, no hasta guardar.
function boxConversionError(row) {
	if (!row.variant || Number(row.variant.m2_per_box) > 0) return ''
	return 'Esta variante no tiene m² por caja configurado; no se puede vender.'
}

// Solo UX: el guard real es hasSufficientStock() de ProductVariant/SimpleProduct
// en el backend.
function hasInsufficientStock(row) {
	if (row.simpleProduct) {
		const stock = simpleProductFor(row).stock_quantity
		if (stock === undefined) return false
		return (row.quantity || 0) > stock
	}

	return (row.quantity || 0) > variantStock(row)
}

// Stock "en vivo" desde el store de Inventario: la variante de la línea es una
// copia tomada al elegirla, y no se entera de un refetch (ver refreshStock).
function variantStock(row) {
	return Number(findInventoryVariant(row.variant.id)?.stock_boxes ?? row.variant.stock_boxes ?? 0)
}

// Mismo texto base que el aviso de QuoteFormView, pero como error: el backend
// rechaza la venta completa si alguna línea excede el stock.
function stockError(row) {
	if (row.simpleProduct) {
		const stock = simpleProductFor(row).stock_quantity
		return `Stock insuficiente: hay ${formatQuantity(stock)} uds. y se requieren ${formatQuantity(row.quantity)}. La venta no podrá registrarse con esta cantidad.`
	}

	const stock = variantStock(row)
	return `Stock insuficiente: hay ${stock} ${stock === 1 ? 'caja' : 'cajas'} y se requieren ${row.quantity}. La venta no podrá registrarse con esta cantidad.`
}

// Precio de lista por m² (variante) o por unidad (simple), el mismo con el que
// se precarga unit_price al elegir el producto.
function listPrice(row) {
	return Number(row.variant ? row.variant.price_per_m2 : simpleProductFor(row).price) || 0
}

// Comparado en centavos para no marcar diferencias de punto flotante.
function priceDiffersFromList(row) {
	if (!hasProduct(row) || !(row.unit_price > 0)) return false
	return Math.round(row.unit_price * 100) !== Math.round(listPrice(row) * 100)
}

// Precio de una caja completa al precio por m² de la línea (lo que vale cada
// caja que se entrega). Null en productos simples o sin m2_per_box.
function boxPrice(row) {
	if (!row.variant) return null
	const m2PerBox = squareMetersForBoxes(1, row.variant.m2_per_box)
	if (m2PerBox === null) return null
	return Math.round(m2PerBox * (Number(row.unit_price) || 0) * 100) / 100
}

function lineSubtotal(row) {
	if (!(row.variant || row.simpleProduct) || !row.quantity || !row.unit_price) return 0
	// Variante: precio por m² sobre los m² que cubren las cajas
	if (row.variant) return (coveredM2(row) ?? 0) * row.unit_price
	return row.quantity * row.unit_price
}

const subtotal = computed(() => lines.value.reduce((sum, row) => sum + lineSubtotal(row), 0))
const total = computed(() => subtotal.value) // sin impuestos por ahora, igual que Cotizaciones
const productCount = computed(() => lines.value.filter(hasProduct).length)

const submitting = ref(false)
const generalError = ref(null)

// Se activa en el primer intento de registrar; desde ahí los errores de cada
// línea se evalúan en vivo y desaparecen en cuanto se captura un valor válido
// (mismo criterio que QuoteFormView).
const submitAttempted = ref(false)

function hasProduct(row) {
	return !!(row.variant || row.simpleProduct)
}

function quantityError(row) {
	if (!submitAttempted.value || !hasProduct(row) || row.quantity > 0) return ''
	return row.variant ? 'Captura las cajas.' : 'Captura la cantidad.'
}

// StoreSaleRequest exige unit_price >= 0.01; sin esto el 422 llegaba como un
// mensaje genérico sin señalar la línea.
function priceError(row) {
	if (!submitAttempted.value || !hasProduct(row) || row.unit_price > 0) return ''
	return 'Captura el precio.'
}

// SaleResource no regresa el stock restante: se recalcula localmente con el
// mismo criterio que SaleController@store (las cajas de cada línea, sumadas por
// variante) y la misma regla de low_stock que ProductVariantResource. Si el
// inventario no está cargado no hay nada que sincronizar.
function syncInventoryStock(items) {
	if (!inventory.initialized) return

	const boxesNeededByVariant = new Map()
	const variantsById = new Map()

	for (const item of items) {
		if (!item.product_variant_id) continue
		const variant = findInventoryVariant(item.product_variant_id)
		if (!variant) continue

		variantsById.set(variant.id, variant)
		const boxesNeeded = item.boxes
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

// Refetch puntual, una sola vez por intento fallido (nunca en loop). Solo los
// stores de los tipos presentes en el form.
function refreshStock() {
	if (lines.value.some((l) => l.variant)) inventory.fetchProducts()
	if (lines.value.some((l) => l.simpleProduct)) simpleProducts.fetchSimpleProducts()
}

function resetForm() {
	form.customer_id = ''
	lines.value = [createEmptyLine()]
	mergedRowId.value = null
	submitAttempted.value = false
	savedSnapshot.value = serializeForm()
}

// Limpiar no navega, así que no pasa por la confirmación de salida: pide la
// suya (solo se habilita con cambios, ver isDirty).
function requestClear() {
	confirm.require({
		header: 'Limpiar venta',
		message: 'Se quitarán el cliente y los productos capturados.',
		accept: () => {
			generalError.value = null
			resetForm()
		},
	})
}

const handleSubmit = async () => {
	generalError.value = null
	submitAttempted.value = true

	// Una línea con producto pero sin cantidad o precio bloquea el registro (antes
	// se descartaba en silencio). Las líneas sin producto sí se ignoran: son filas
	// agregadas con "+ Agregar producto" que no se llegaron a usar.
	if (lines.value.some((l) => quantityError(l) || priceError(l))) {
		generalError.value = 'Hay productos sin cantidad o precio. Captúralos o quita la línea.'
		return
	}

	if (lines.value.some((l) => boxConversionError(l))) {
		generalError.value = 'Hay variantes sin m² por caja configurado. Quítalas o corrígelas en Inventario.'
		return
	}

	const validLines = lines.value.filter(hasProduct)
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
				// Variante: cajas (los m² los deriva el backend). Simple: unidades.
				...(l.simpleProduct
					? { simple_product_id: l.simpleProduct.id, quantity: l.quantity }
					: { product_variant_id: l.variant.id, boxes: l.quantity }),
				unit_price: l.unit_price,
			})),
		}

		const sale = await sales.createSale(payload)
		syncInventoryStock(payload.items)
		syncSimpleProductsStock(payload.items)

		// El listado de cotizaciones cacheado no se refetchea: el status se
		// actualiza in-place.
		if (quoteId.value) quotes.markQuoteConverted(quoteId.value)

		// Venta directa y conversión van al detalle de la venta (no se limpia el
		// form ni se vuelve a la cotización): lo siguiente es entregar la nota,
		// y PDF/Compartir viven ahí. El detalle ofrece "Nueva venta" para el
		// siguiente cliente y enlaza de vuelta a la cotización de origen.
		skipLeaveGuard = true
		notify.success(
			`Venta ${sale.folio} registrada`,
			quoteId.value ? 'La cotización quedó como Convertida.' : undefined,
		)
		router.push({ name: 'pos.sales.show', params: { id: sale.id } })
	} catch (err) {
		console.error(err)
		// 422 del backend (stock insuficiente, variante sin m2_per_box, cantidad
		// fraccionaria en un producto simple, o validación del Form Request) ya
		// trae un mensaje listo para mostrar.
		generalError.value = err.response?.data?.message || 'No se pudo registrar la venta. Intenta de nuevo.'

		// Un 422 de negocio (sin `errors` de Form Request) puede venir de stock que
		// cambió con el form abierto (otra venta, un ajuste): se refresca una vez
		// para que el aviso por línea muestre lo disponible real.
		if (err.response?.status === 422 && !err.response.data?.errors) refreshStock()
	} finally {
		submitting.value = false
	}
}

// Al final del script: con `immediate` corre en setup y necesita que lines,
// generalError, etc. ya estén declarados.
watch(quoteId, () => {
	conversionError.value = null
	generalError.value = null
	resetForm()
	if (quoteId.value) loadConversion()
}, { immediate: true })
</script>

<style scoped>

</style>
