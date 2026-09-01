<template>
	<div class="p-2 max-w-4xl">
		<div class="mb-4">
			<h1 class="font-serif text-xl text-primary">{{ route.meta.title }}</h1>
			<p class="text-sm text-text-muted mt-0.5">Selecciona los productos y captura las cantidades de la cotización.</p>
		</div>

		<p v-if="generalError" class="text-danger text-[13px] mb-4 flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
			<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			{{ generalError }}
		</p>

		<form @submit.prevent="handleSubmit" class="space-y-4">
			<!-- Sección 1 — Datos generales -->
			<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
				<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">Datos generales</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label for="customer_id" class="text-xs font-medium text-text-muted block">Cliente</label>
						<select
							id="customer_id"
							v-model="form.customer_id"
							:disabled="customersLoading"
							class="w-full bg-surface border border-border text-sm text-text focus:outline-none focus:border-accent transition-colors px-3 h-[38px] rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
						>
							<option value="">{{ customersLoading ? 'Cargando…' : 'Sin cliente' }}</option>
							<option v-for="customer in customers" :key="customer.id" :value="customer.id">{{ customer.name }}</option>
						</select>
					</div>

					<div class="space-y-1.5 sm:col-span-2">
						<label for="notes" class="text-xs font-medium text-text-muted block">Notas</label>
						<textarea
							id="notes"
							v-model="form.notes"
							rows="3"
							placeholder="Notas adicionales para esta cotización (opcional)"
							class="w-full bg-surface border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors px-3 py-2 rounded-md resize-none"
						></textarea>
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

						<!-- Sin variante seleccionada: buscador -->
						<div v-if="!row.variant" class="relative">
							<input
								v-model="row.searchQuery"
								type="text"
								placeholder="Buscar por código, línea o color…"
								@focus="row.showDropdown = true"
								@blur="closeDropdownDelayed(row)"
								class="w-full bg-surface border border-border text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors px-3 h-[38px] rounded-md"
							/>

							<div
								v-if="row.showDropdown && rowResults(row).length > 0"
								class="absolute z-10 mt-1 w-full bg-surface border border-border rounded-md max-h-64 overflow-y-auto"
							>
								<button
									v-for="option in rowResults(row)"
									:key="option.id"
									type="button"
									@mousedown.prevent="selectVariantForRow(row, option)"
									class="w-full text-left px-3 py-2 hover:bg-bg transition-colors border-b border-border last:border-b-0"
								>
									<p class="text-sm text-text">{{ option.lineName }} — {{ option.color }} — {{ option.size }}</p>
									<p class="text-xs text-text-muted mt-0.5">
										{{ formatCurrency(option.price_per_m2) }}/m² · Stock: {{ option.stock_boxes }} cajas
									</p>
								</button>
							</div>

							<p
								v-else-if="row.showDropdown && row.searchQuery.trim()"
								class="absolute z-10 mt-1 w-full bg-surface border border-border rounded-md px-3 py-2 text-xs text-text-muted"
							>
								Sin resultados.
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
import axios from '@/lib/axios'
import { useInventoryStore } from '@/stores/inventory'
import { useQuotesStore } from '@/stores/quotes'

const route = useRoute()
const router = useRouter()
const inventory = useInventoryStore()
const quotes = useQuotesStore()

onMounted(() => {
	if (!inventory.initialized) inventory.fetchProducts()
	fetchCustomers()
})

const form = reactive({
	customer_id: '',
	notes: '',
})

// GET /api/customers acepta ?search=, pero para un catálogo de este tamaño se
// carga completo una sola vez y se filtra en el <select> nativo del navegador.
const customers = ref([])
const customersLoading = ref(false)

async function fetchCustomers() {
	customersLoading.value = true

	try {
		const { data } = await axios.get('/api/customers')
		customers.value = data.data
	} catch (err) {
		console.error(err)
	} finally {
		customersLoading.value = false
	}
}

// GET /api/product-variants no soporta búsqueda de texto libre — se reutiliza
// inventory.fetchProducts() (ya usado por InventoryView) y se filtra 100%
// client-side, mismo patrón que el buscador de InventoryView.
const flatVariants = computed(() => {
	const result = []
	for (const product of inventory.products) {
		for (const variant of product.variants ?? []) {
			result.push({ ...variant, lineName: product.name })
		}
	}
	return result
})

function normalize(str) {
	return (str ?? '')
		.toString()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
}

function rowResults(row) {
	const q = normalize(row.searchQuery).trim()
	if (!q) return []

	return flatVariants.value
		.filter((v) => normalize(`${v.lineName} ${v.color} ${v.size} ${v.code}`).includes(q))
		.slice(0, 8)
}

// Cierra el dropdown al perder foco, con un pequeño delay para que el click
// en un resultado (mousedown.prevent) alcance a registrarse antes del blur.
function closeDropdownDelayed(row) {
	setTimeout(() => {
		row.showDropdown = false
	}, 150)
}

function createEmptyLine() {
	return {
		id: crypto.randomUUID(),
		variant: null,
		quantity: null,
		searchQuery: '',
		showDropdown: false,
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
	row.searchQuery = ''
	row.showDropdown = false
}

// Si la variante ya existe en otra línea del form, se suma la cantidad nueva
// a esa línea existente en vez de duplicar la fila (ver AGENT.md — listas
// repetibles no deben permitir estado duplicado inconsistente).
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
	}

	row.searchQuery = ''
	row.showDropdown = false
}

function boxesFor(row) {
	if (!row.variant?.m2_per_box) return null
	return Math.ceil((row.quantity || 0) / row.variant.m2_per_box)
}

function hasInsufficientStock(row) {
	const boxes = boxesFor(row)
	if (boxes === null) return false
	return boxes > (row.variant.stock_boxes ?? 0)
}

function lineSubtotal(row) {
	if (!row.variant || !row.quantity) return 0
	return row.quantity * row.variant.price_per_m2
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

	const validLines = lines.value.filter((l) => l.variant && l.quantity > 0)
	if (validLines.length === 0) {
		generalError.value = 'Agrega al menos un producto con cantidad mayor a cero.'
		return
	}

	submitting.value = true

	try {
		const payload = {
			customer_id: form.customer_id || null,
			notes: form.notes || null,
			items: validLines.map((l) => ({
				product_variant_id: l.variant.id,
				quantity: l.quantity,
			})),
		}

		await quotes.createQuote(payload)
		router.push({ name: 'quotes' })
	} catch (err) {
		console.error(err)
		generalError.value = err.response?.data?.message || 'No se pudo guardar la cotización. Intenta de nuevo.'
	} finally {
		submitting.value = false
	}
}

function handleCancel() {
	router.push({ name: 'quotes' })
}
</script>

<style scoped>

</style>
