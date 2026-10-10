<template>
	<div class="p-2 max-w-4xl">
		<div class="mb-4">
			<h1 class="font-serif text-xl text-primary">{{ route.meta.title }}</h1>
			<p class="text-sm text-text-muted mt-0.5">
				{{ isEditMode ? 'Actualiza los datos del producto.' : 'Captura los datos del producto. El stock inicia en 0.' }}
			</p>
		</div>

		<p v-if="generalError" class="text-danger text-[13px] mb-4 flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
			<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			{{ generalError }}
		</p>

		<form @submit.prevent="handleSubmit" class="space-y-4">
			<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
				<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">Datos del producto</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<FieldLabel html-for="category_id" text="Categoría" required />
						<SelectCustom
							id="category_id"
							v-model="form.category_id"
							:options="simpleCategories"
							:loading="catalogs.loading"
							:disabled="loadingProduct"
							:error="errors.category_id"
							placeholder="Selecciona una categoría"
							empty-message="No hay categorías de tipo General"
							@change="errors.category_id = ''"
						/>
						<p v-if="errors.category_id" class="text-danger text-[12px] mt-1.5">{{ errors.category_id }}</p>
					</div>

					<div class="space-y-1.5">
						<FieldLabel html-for="name" text="Nombre" required />
						<InputTextCustom
							id="name"
							v-model="form.name"
							:error="errors.name"
							autocomplete="off"
							placeholder="Ej. Pegazulejo gris 20 kg"
							:disabled="loadingProduct"
							@input="errors.name = ''"
						/>
						<p v-if="errors.name" class="text-danger text-[12px] mt-1.5">{{ errors.name }}</p>
					</div>

					<div class="space-y-1.5">
						<FieldLabel html-for="price" text="Precio" required />
						<InputNumberCustom
							id="price"
							v-model="form.price"
							:error="errors.price"
							:min="0"
							placeholder="$0.00"
							mode="currency"
							currency="MXN"
							:disabled="loadingProduct"
							@input="errors.price = ''"
						/>
						<p v-if="errors.price" class="text-danger text-[12px] mt-1.5">{{ errors.price }}</p>
					</div>

					<div v-if="isEditMode" class="space-y-1.5">
						<FieldLabel html-for="stock_quantity" text="Stock actual" />
						<div class="flex items-center gap-2">
							<output
								id="stock_quantity"
								class="flex-1 flex items-center h-10 px-3 bg-bg border border-border rounded-md text-sm text-text"
							>
								{{ loadingProduct ? '—' : `${stockQuantity} unidades` }}
							</output>
							<button
								type="button"
								@click="stockDialogOpen = true"
								:disabled="loadingProduct || loadFailed"
								class="inline-flex items-center gap-1.5 bg-surface border border-border hover:bg-bg disabled:opacity-60 disabled:cursor-not-allowed text-text font-medium text-sm h-10 px-3 rounded-md transition-colors select-none cursor-pointer"
							>
								<i class="ti ti-adjustments-horizontal text-sm"></i>
								Ajustar stock
							</button>
						</div>
					</div>

					<div class="space-y-1.5 sm:col-span-2">
						<FieldLabel html-for="description" text="Descripción" />
						<TextareaCustom
							id="description"
							v-model="form.description"
							:error="errors.description"
							rows="3"
							placeholder="Detalles adicionales del producto"
							:disabled="loadingProduct"
							@input="errors.description = ''"
						/>
						<p v-if="errors.description" class="text-danger text-[12px] mt-1.5">{{ errors.description }}</p>
					</div>
				</div>
			</div>

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
					:disabled="submitting || loadingProduct || loadFailed"
					class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
				>
					{{ submitting ? 'Guardando…' : isEditMode ? 'Guardar cambios' : 'Guardar producto' }}
				</button>
			</div>
		</form>

		<StockAdjustDialog
			v-if="isEditMode"
			v-model:visible="stockDialogOpen"
			:url="`/api/simple-products/${route.params.id}/stock`"
			:stock="stockQuantity"
			stock-unit="unidades"
			quantity-label="Cantidad (unidades)"
			:subtitle="form.name"
			@stock-updated="onStockUpdated"
		/>
	</div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCatalogsStore } from '@/stores/catalogs'
import { useSimpleProductsStore } from '@/stores/simpleProducts'
import SelectCustom from '@/components/widgets/SelectCustom.vue'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'
import InputNumberCustom from '@/components/widgets/InputNumberCustom.vue'
import TextareaCustom from '@/components/widgets/TextareaCustom.vue'
import FieldLabel from '@/components/widgets/labels/FieldLabel.vue'
import StockAdjustDialog from './components/StockAdjustDialog.vue'

const route = useRoute()
const router = useRouter()
const catalogs = useCatalogsStore()
const simpleProducts = useSimpleProductsStore()

const isEditMode = computed(() => !!route.params.id)
const loadingProduct = ref(false)
// Mismo criterio que CustomerFormView: si la precarga falla en edición no hay
// nada válido que guardar, así que el submit queda deshabilitado.
const loadFailed = ref(false)

// El backend rechaza (422) un producto simple en una categoría de tipo 'variant'.
const simpleCategories = computed(() =>
	catalogs.categories.filter((c) => c.product_form_type === 'simple'),
)

const form = reactive({
	category_id: '',
	name: '',
	price: null,
	description: '',
})

const errors = reactive({
	category_id: '',
	name: '',
	price: '',
	description: '',
})

// Solo lectura en el form: el stock se modifica únicamente vía PATCH /stock.
const stockQuantity = ref(0)
const stockDialogOpen = ref(false)

const submitting = ref(false)
const generalError = ref(null)

onMounted(() => {
	if (!catalogs.initialized) catalogs.fetchCatalogs()
	if (isEditMode.value) loadProduct()
})

async function loadProduct() {
	loadingProduct.value = true

	try {
		const product = await simpleProducts.fetchSimpleProduct(route.params.id)
		form.category_id = product.category_id
		form.name = product.name
		form.price = product.price
		form.description = product.description ?? ''
		stockQuantity.value = product.stock_quantity
	} catch (err) {
		console.error(err)
		generalError.value = err.response?.status === 404 ? 'El producto no existe.' : 'No se pudo cargar el producto.'
		loadFailed.value = true
	} finally {
		loadingProduct.value = false
	}
}

function onStockUpdated(product) {
	stockQuantity.value = product.stock_quantity
	simpleProducts.updateSimpleProductStock(product.id, { stock_quantity: product.stock_quantity })
}

const requiredFields = ['category_id', 'name', 'price']

function validateForm() {
	let isValid = true

	for (const field of requiredFields) {
		const value = typeof form[field] === 'string' ? form[field].trim() : form[field]
		errors[field] = value === '' || value === null ? 'Este campo es requerido' : ''
		if (errors[field]) isValid = false
	}

	return isValid
}

function applyServerErrors(serverErrors) {
	for (const field of Object.keys(serverErrors)) {
		if (field in errors) {
			errors[field] = serverErrors[field][0]
		}
	}
}

async function handleSubmit() {
	if (!validateForm()) return

	generalError.value = null
	submitting.value = true

	const payload = {
		category_id: form.category_id,
		name: form.name.trim(),
		price: form.price,
		description: form.description.trim() || null,
	}

	try {
		if (isEditMode.value) {
			await simpleProducts.updateSimpleProduct(route.params.id, payload)
		} else {
			await simpleProducts.createSimpleProduct(payload)
		}

		router.push({ name: 'inventory' })
	} catch (err) {
		// El 422 de "categoría que no admite productos simples" llega sin `errors`,
		// solo con `message`.
		if (err.response?.status === 422 && err.response.data.errors) {
			applyServerErrors(err.response.data.errors)
		} else {
			console.error(err)
			generalError.value = err.response?.data?.message || 'No se pudo guardar el producto. Intenta de nuevo.'
		}
	} finally {
		submitting.value = false
	}
}

function handleCancel() {
	router.push({ name: 'inventory' })
}
</script>

<style scoped></style>
