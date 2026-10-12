<template>
	<div class="p-2 max-w-4xl">
		<div class="mb-4">
			<h1 class="font-serif text-xl text-primary">{{ route.meta.title }}</h1>
			<p class="text-sm text-text-muted mt-0.5">Selecciona los productos y captura las cantidades de la cotización.</p>
		</div>

		<div v-if="loadingQuote" class="text-text-muted text-sm">Cargando cotización…</div>

		<p v-if="loadError" class="text-danger text-sm mb-4 flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
			<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			{{ loadError }}
		</p>

		<form v-if="!loadingQuote && !loadError" @submit.prevent="handleSubmit" class="space-y-4">
			<!-- Sección 1 — Datos generales -->
			<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
				<h2 class="text-xs font-medium uppercase tracking-wide text-text-muted mb-4">Datos generales</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<FieldLabel html-for="customer_id" text="Cliente" />
						<CustomerSearch id="customer_id" v-model="form.customer_id" />
					</div>

					<div class="space-y-1.5 sm:col-span-2">
						<FieldLabel html-for="notes" text="Notas" />
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
							class="flex-1 grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 text-xs font-medium uppercase tracking-wide text-text-muted"
						>
							<span>Producto<span class="text-danger ml-0.5">*</span></span>
							<span>Cantidad<span class="text-danger ml-0.5">*</span></span>
							<span>Precio unitario</span>
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
									class="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3"
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
									</div>

									<!-- Cantidad: la unidad va como sufijo del input; en variantes, el
									     equivalente en cajas debajo -->
									<div class="space-y-1.5 sm:space-y-0">
										<FieldLabel
											:html-for="`quantity-${row.id}`"
											:text="row.variant ? 'Cantidad (m²)' : 'Cantidad (unidades)'"
											required
											class="sm:sr-only"
										/>
										<InputNumberCustom
											v-if="row.variant"
											:id="`quantity-${row.id}`"
											v-model="row.quantity"
											:min="0.01"
											placeholder="0.00 m²"
											suffix=" m²"
											:max-fraction-digits="2"
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
										<p v-else-if="row.variant" class="text-xs text-text-muted mt-1">
											{{ boxesFor(row) === null ? 'Sin equivalencia en cajas' : `${boxesFor(row)} ${boxesFor(row) === 1 ? 'caja' : 'cajas'}` }}
										</p>
									</div>

									<!-- Precio de lista, informativo: en cotización no se edita -->
									<div class="space-y-1.5 sm:space-y-0">
										<span class="text-xs font-medium text-text-muted block sm:sr-only">Precio unitario</span>
										<p class="sm:h-[2.375rem] flex items-center text-sm text-text-muted tabular-nums">
											{{ row.variant ? `${formatCurrency(row.variant.price_per_m2)}/m²` : formatCurrency(simpleProductFor(row).price) }}
										</p>
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

							<p
								v-if="hasProduct(row) && hasInsufficientStock(row)"
								class="mt-2 sm:mr-10 flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2"
							>
								<i class="ti ti-alert-triangle text-sm leading-none" aria-hidden="true"></i>
								<span>{{ stockWarning(row) }}</span>
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

			<!-- Junto a las acciones (no arriba del form): con varias líneas, el inicio
			     del form queda fuera de vista al presionar Guardar. -->
			<p v-if="generalError" role="alert" class="text-danger text-sm flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
				<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				{{ generalError }}
			</p>

			<!-- Acciones -->
			<div class="flex items-center justify-end gap-3">
				<button
					type="button"
					@click="handleCancel"
					class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="submit"
					:disabled="submitting"
					class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
				>
					{{ submitting ? 'Guardando…' : 'Guardar cotización' }}
				</button>
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
							Descartar cambios
						</button>
					</div>
				</div>
			</template>
		</ConfirmDialog>
	</div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useInventoryStore } from '@/stores/inventory'
import { useSimpleProductsStore } from '@/stores/simpleProducts'
import { useCatalogsStore } from '@/stores/catalogs'
import { useQuotesStore } from '@/stores/quotes'
import CustomerSearch from '@/components/widgets/autocompletes/CustomerSearch.vue'
import ProductAutocomplete from '@/components/widgets/autocompletes/ProductAutocomplete.vue'
import InputNumberCustom from '@/components/widgets/InputNumberCustom.vue'
import TextareaCustom from '@/components/widgets/TextareaCustom.vue'
import FieldLabel from '@/components/widgets/labels/FieldLabel.vue'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatQuantity } from '@/lib/formatQuantity'
import { useNotify } from '@/composables/useNotify'

const route = useRoute()
const router = useRouter()
const inventory = useInventoryStore()
const simpleProducts = useSimpleProductsStore()
const catalogs = useCatalogsStore()
const quotes = useQuotesStore()
const notify = useNotify()
const confirm = useConfirm()

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
		loadError.value = quotes.currentQuoteError || 'No se pudo cargar la cotización.'
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
	savedSnapshot.value = serializeForm()
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

// Cambios sin guardar: se compara contra una foto del form tomada al iniciar
// (creación) o al terminar de cargar la cotización (edición). Solo cuenta lo
// que se envía al backend; una línea vacía agregada y sin usar no es un cambio.
function serializeForm() {
	return JSON.stringify({
		customer_id: form.customer_id || null,
		notes: form.notes || null,
		lines: lines.value
			.filter((l) => l.variant || l.simpleProduct)
			.map((l) => [l.variant?.id ?? null, l.simpleProduct?.id ?? null, l.quantity ?? null]),
	})
}

const savedSnapshot = ref(serializeForm())
const isDirty = computed(() => serializeForm() !== savedSnapshot.value)
// Tras guardar se navega fuera del form sin pasar por la confirmación.
let skipLeaveGuard = false

onBeforeRouteLeave(() => {
	if (skipLeaveGuard || !isDirty.value) return true

	return new Promise((resolve) => {
		confirm.require({
			header: 'Descartar cambios',
			message: 'Hay cambios sin guardar en esta cotización. Si sales ahora, se perderán.',
			accept: () => resolve(true),
			reject: () => resolve(false),
			onHide: () => resolve(false),
		})
	})
})

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

// Es un aviso, no un error: la cotización se puede guardar igual (el stock se
// valida hasta convertirla en venta).
function stockWarning(row) {
	if (row.simpleProduct) {
		const stock = simpleProductFor(row).stock_quantity
		return `Stock insuficiente: hay ${formatQuantity(stock)} uds. y se cotizan ${formatQuantity(row.quantity)}. Consultar disponibilidad sobre pedido.`
	}

	const stock = row.variant.stock_boxes ?? 0
	return `Stock insuficiente: hay ${stock} ${stock === 1 ? 'caja' : 'cajas'} y se requieren ${boxesFor(row)}. Consultar disponibilidad sobre pedido.`
}

function lineSubtotal(row) {
	if (!row.quantity) return 0
	if (row.simpleProduct) return row.quantity * simpleProductFor(row).price
	if (row.variant) return row.quantity * row.variant.price_per_m2
	return 0
}

const subtotal = computed(() => lines.value.reduce((sum, row) => sum + lineSubtotal(row), 0))
const total = computed(() => subtotal.value) // sin impuestos por ahora, igual que el backend

const submitting = ref(false)
const generalError = ref(null)
// Fallo de fetchQuote en modo edición: oculta el form (no se debe poder
// enviar uno vacío sobre una cotización que no cargó). generalError queda
// solo para errores de submit, que no desmontan el form.
const loadError = ref(null)

// Se activa en el primer intento de guardar; desde ahí el error de cantidad de
// cada línea se evalúa en vivo y desaparece en cuanto se captura un valor válido.
const submitAttempted = ref(false)

function hasProduct(row) {
	return !!(row.variant || row.simpleProduct)
}

function quantityError(row) {
	if (!submitAttempted.value || !hasProduct(row) || row.quantity > 0) return ''
	return 'Captura la cantidad.'
}

const handleSubmit = async () => {
	generalError.value = null
	submitAttempted.value = true

	// Una línea con producto pero sin cantidad bloquea el guardado (antes se
	// descartaba en silencio). Las líneas sin producto sí se ignoran: son filas
	// agregadas con "+ Agregar producto" que no se llegaron a usar.
	if (lines.value.some((l) => quantityError(l))) {
		generalError.value = 'Hay productos sin cantidad. Captúrala o quita la línea.'
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
			notes: form.notes || null,
			items: validLines.map((l) => (l.simpleProduct
				? { simple_product_id: l.simpleProduct.id, quantity: l.quantity }
				: { product_variant_id: l.variant.id, quantity: l.quantity })),
		}

		if (isEdit.value) {
			const updated = await quotes.updateQuote(quoteId.value, payload)
			skipLeaveGuard = true
			notify.success(`Cotización ${updated.folio} actualizada`)
			router.push({ name: 'quotes.show', params: { id: quoteId.value } })
		} else {
			// Al detalle, no al listado: lo siguiente suele ser descargar o compartir el PDF.
			const created = await quotes.createQuote(payload)
			skipLeaveGuard = true
			notify.success(`Cotización ${created.folio} guardada`)
			router.push({ name: 'quotes.show', params: { id: created.id } })
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
