<template>
	<div class="p-2 max-w-4xl">
		<div class="mb-4">
			<h1 class="font-serif text-xl text-primary">Nuevo producto</h1>
			<p class="text-sm text-text-muted mt-0.5">Captura la línea de producto junto con su primera variante.</p>
		</div>

		<form @submit.prevent="handleSubmit" class="space-y-4">
			<!-- Sección 1 — Datos del producto (línea) -->
			<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
				<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">
					Datos del producto (línea)
				</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label for="supplier_id" class="text-xs font-medium text-text-muted block">Proveedor</label>
						<select
							id="supplier_id"
							v-model="form.supplier_id"
							@change="errors.supplier_id = ''"
							class="w-full bg-surface border text-sm text-text focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="errors.supplier_id ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
						>
							<option value="" disabled>Selecciona un proveedor</option>
							<option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">{{ supplier.name }}</option>
						</select>
						<p v-if="errors.supplier_id" class="text-danger text-[12px] mt-1.5">{{ errors.supplier_id }}</p>
					</div>

					<div class="space-y-1.5">
						<label for="category_id" class="text-xs font-medium text-text-muted block">Categoría</label>
						<select
							id="category_id"
							v-model="form.category_id"
							@change="errors.category_id = ''"
							class="w-full bg-surface border text-sm text-text focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="errors.category_id ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
						>
							<option value="" disabled>Selecciona una categoría</option>
							<option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
						</select>
						<p v-if="errors.category_id" class="text-danger text-[12px] mt-1.5">{{ errors.category_id }}</p>
					</div>

					<div class="space-y-1.5">
						<label for="unit_type_id" class="text-xs font-medium text-text-muted block">Unidad</label>
						<select
							id="unit_type_id"
							v-model="form.unit_type_id"
							@change="errors.unit_type_id = ''"
							class="w-full bg-surface border text-sm text-text focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="errors.unit_type_id ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
						>
							<option value="" disabled>Selecciona una unidad</option>
							<option v-for="unitType in unitTypes" :key="unitType.id" :value="unitType.id">{{ unitType.name }}</option>
						</select>
						<p v-if="errors.unit_type_id" class="text-danger text-[12px] mt-1.5">{{ errors.unit_type_id }}</p>
					</div>

					<div class="space-y-1.5">
						<label for="name" class="text-xs font-medium text-text-muted block">Nombre</label>
						<input
							id="name"
							v-model="form.name"
							type="text"
							placeholder="Ej. Porcelanato Carrara"
							@input="errors.name = ''"
							class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="errors.name ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
						/>
						<p v-if="errors.name" class="text-danger text-[12px] mt-1.5">{{ errors.name }}</p>
					</div>

					<div class="space-y-1.5">
						<label for="purchase_unit" class="text-xs font-medium text-text-muted block">Unidad de compra</label>
						<input
							id="purchase_unit"
							v-model="form.purchase_unit"
							type="text"
							placeholder="Ej. Caja"
							@input="errors.purchase_unit = ''"
							class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="errors.purchase_unit ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
						/>
						<p v-if="errors.purchase_unit" class="text-danger text-[12px] mt-1.5">{{ errors.purchase_unit }}</p>
					</div>
				</div>
			</div>

			<!-- Sección 2 — Datos de la variante inicial -->
			<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
				<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">
					Datos de la variante inicial
				</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					<div class="space-y-1.5">
						<label for="size" class="text-xs font-medium text-text-muted block">Medida</label>
						<input
							id="size"
							v-model="variant.size"
							type="text"
							placeholder="Ej. 60X120"
							@input="variantErrors.size = ''"
							class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="variantErrors.size ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
						/>
						<p v-if="variantErrors.size" class="text-danger text-[12px] mt-1.5">{{ variantErrors.size }}</p>
					</div>

					<div class="space-y-1.5">
						<label for="pei" class="text-xs font-medium text-text-muted block">PEI</label>
						<select
							id="pei"
							v-model="variant.pei"
							@change="variantErrors.pei = ''"
							class="w-full bg-surface border text-sm text-text focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="variantErrors.pei ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
						>
							<option value="" disabled>Selecciona un PEI</option>
							<option v-for="option in peiOptions" :key="option" :value="option">{{ option }}</option>
						</select>
						<p v-if="variantErrors.pei" class="text-danger text-[12px] mt-1.5">{{ variantErrors.pei }}</p>
					</div>

					<div class="space-y-1.5">
						<label for="ett" class="text-xs font-medium text-text-muted block">ETT</label>
						<input
							id="ett"
							v-model="variant.ett"
							type="text"
							placeholder="Ej. 9.5mm"
							@input="variantErrors.ett = ''"
							class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="variantErrors.ett ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
						/>
						<p v-if="variantErrors.ett" class="text-danger text-[12px] mt-1.5">{{ variantErrors.ett }}</p>
					</div>

					<div class="space-y-1.5">
						<label for="kilos_per_box" class="text-xs font-medium text-text-muted block">Kilos por caja</label>
						<input
							id="kilos_per_box"
							v-model.number="variant.kilos_per_box"
							type="number"
							min="0"
							step="0.01"
							placeholder="0.00"
							@input="variantErrors.kilos_per_box = ''"
							class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="variantErrors.kilos_per_box ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
						/>
						<p v-if="variantErrors.kilos_per_box" class="text-danger text-[12px] mt-1.5">{{ variantErrors.kilos_per_box }}</p>
					</div>

					<div class="space-y-1.5">
						<label for="boxes_per_pallet" class="text-xs font-medium text-text-muted block">Cajas por tarima</label>
						<input
							id="boxes_per_pallet"
							v-model.number="variant.boxes_per_pallet"
							type="number"
							min="0"
							step="1"
							placeholder="0"
							@input="variantErrors.boxes_per_pallet = ''"
							class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="variantErrors.boxes_per_pallet ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
						/>
						<p v-if="variantErrors.boxes_per_pallet" class="text-danger text-[12px] mt-1.5">{{ variantErrors.boxes_per_pallet }}</p>
					</div>

					<div class="space-y-1.5">
						<label for="commission_category_id" class="text-xs font-medium text-text-muted block">Categoría de comisión</label>
						<select
							id="commission_category_id"
							v-model="variant.commission_category_id"
							@change="variantErrors.commission_category_id = ''"
							class="w-full bg-surface border text-sm text-text focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="variantErrors.commission_category_id ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
						>
							<option value="">Sin categoría</option>
							<option v-for="commissionCategory in commissionCategories" :key="commissionCategory.id" :value="commissionCategory.id">
								{{ commissionCategory.name }}
							</option>
						</select>
						<p v-if="variantErrors.commission_category_id" class="text-danger text-[12px] mt-1.5">{{ variantErrors.commission_category_id }}</p>
					</div>

					<div class="space-y-1.5">
						<label for="price_per_box" class="text-xs font-medium text-text-muted block">Precio por caja</label>
						<div class="relative">
							<span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted text-sm">$</span>
							<input
								id="price_per_box"
								v-model.number="variant.price_per_box"
								type="number"
								min="0"
								step="0.01"
								placeholder="0.00"
								@input="variantErrors.price_per_box = ''"
								class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors pl-6 pr-3 h-[38px] rounded-md"
								:class="variantErrors.price_per_box ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
							/>
						</div>
						<p v-if="variantErrors.price_per_box" class="text-danger text-[12px] mt-1.5">{{ variantErrors.price_per_box }}</p>
					</div>

					<div class="space-y-1.5">
						<label for="price_per_m2" class="text-xs font-medium text-text-muted block">Precio por m²</label>
						<div class="relative">
							<span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted text-sm">$</span>
							<input
								id="price_per_m2"
								v-model.number="variant.price_per_m2"
								type="number"
								min="0"
								step="0.01"
								placeholder="0.00"
								@input="variantErrors.price_per_m2 = ''"
								class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors pl-6 pr-3 h-[38px] rounded-md"
								:class="variantErrors.price_per_m2 ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
							/>
						</div>
						<p v-if="variantErrors.price_per_m2" class="text-danger text-[12px] mt-1.5">{{ variantErrors.price_per_m2 }}</p>
					</div>

					<div class="space-y-1.5">
						<label for="pieces_per_box" class="text-xs font-medium text-text-muted block">Piezas por caja</label>
						<input
							id="pieces_per_box"
							v-model.number="variant.pieces_per_box"
							type="number"
							min="0"
							step="1"
							placeholder="0"
							@input="variantErrors.pieces_per_box = ''"
							class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="variantErrors.pieces_per_box ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
						/>
						<p v-if="variantErrors.pieces_per_box" class="text-danger text-[12px] mt-1.5">{{ variantErrors.pieces_per_box }}</p>
					</div>

					<div class="space-y-1.5">
						<label for="m2_per_box" class="text-xs font-medium text-text-muted block">m² por caja</label>
						<input
							id="m2_per_box"
							v-model.number="variant.m2_per_box"
							type="number"
							min="0"
							step="0.01"
							placeholder="0.00"
							@input="variantErrors.m2_per_box = ''"
							class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="variantErrors.m2_per_box ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
						/>
						<p v-if="variantErrors.m2_per_box" class="text-danger text-[12px] mt-1.5">{{ variantErrors.m2_per_box }}</p>
					</div>
				</div>

				<!-- Colores — lista repetible: cada fila se convierte en su propia variante -->
				<div class="mt-6">
					<h3 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-3">Colores</h3>

					<div class="space-y-3">
						<div
							v-for="(row, index) in colorRows"
							:key="row.id"
							class="border border-border rounded-md p-4"
						>
							<div class="flex items-center justify-between mb-3">
								<span class="text-xs font-medium text-text-muted">Color {{ index + 1 }}</span>
								<button
									type="button"
									@click="removeColorRow(row.id)"
									:disabled="colorRows.length === 1"
									class="text-text-muted hover:text-danger disabled:opacity-30 disabled:hover:text-text-muted disabled:cursor-not-allowed transition-colors"
									aria-label="Eliminar color"
									title="Eliminar color"
								>
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M6 18L18 6" />
									</svg>
								</button>
							</div>

							<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div class="space-y-1.5">
									<label :for="`color-${row.id}`" class="text-xs font-medium text-text-muted block">Color</label>
									<input
										:id="`color-${row.id}`"
										v-model="row.color"
										type="text"
										placeholder="Ej. Blanco"
										@input="row.errors.color = ''"
										class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
										:class="row.errors.color ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
									/>
									<p v-if="row.errors.color" class="text-danger text-[12px] mt-1.5">{{ row.errors.color }}</p>
								</div>

								<div class="space-y-1.5">
									<label :for="`stock_boxes-${row.id}`" class="text-xs font-medium text-text-muted block">Stock inicial (cajas)</label>
									<input
										:id="`stock_boxes-${row.id}`"
										v-model.number="row.stock_boxes"
										type="number"
										min="0"
										step="1"
										placeholder="0"
										@input="row.errors.stock_boxes = ''"
										class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
										:class="row.errors.stock_boxes ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
									/>
									<p v-if="row.errors.stock_boxes" class="text-danger text-[12px] mt-1.5">{{ row.errors.stock_boxes }}</p>
								</div>

								<div class="space-y-1.5">
									<label :for="`minimum_stock-${row.id}`" class="text-xs font-medium text-text-muted block">Stock mínimo</label>
									<input
										:id="`minimum_stock-${row.id}`"
										v-model.number="row.minimum_stock"
										type="number"
										min="0"
										step="1"
										placeholder="0"
										@input="row.errors.minimum_stock = ''"
										class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
										:class="row.errors.minimum_stock ? 'border-danger focus:border-danger' : 'border-border focus:border-accent'"
									/>
									<p v-if="row.errors.minimum_stock" class="text-danger text-[12px] mt-1.5">{{ row.errors.minimum_stock }}</p>
								</div>
							</div>
						</div>
					</div>

					<button
						type="button"
						@click="addColorRow"
						class="mt-3 w-full border border-dashed border-border rounded-md py-2 text-sm text-text-muted hover:text-text hover:border-accent transition-colors select-none cursor-pointer"
					>
						+ Agregar color
					</button>
				</div>
			</div>

			<!-- Acciones -->
			<div class="flex items-center justify-end gap-3">
				<button
					type="button"
					class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="submit"
					class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
				>
					Guardar producto
				</button>
			</div>
		</form>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue'

// Catálogos de ejemplo — se reemplazan por el catalogs store en un paso posterior.
const suppliers = [
	{ id: 1, name: 'Interceramic' },
	{ id: 2, name: 'Vitromex' },
	{ id: 3, name: 'Porcelanite Lamosa' },
]

const categories = [
	{ id: 1, name: 'Piso' },
	{ id: 2, name: 'Muro' },
	{ id: 3, name: 'Fachada' },
]

const unitTypes = [
	{ id: 1, name: 'Caja' },
	{ id: 2, name: 'Pieza' },
	{ id: 3, name: 'm²' },
]

const commissionCategories = [
	{ id: 1, name: 'Categoría A' },
	{ id: 2, name: 'Categoría B' },
	{ id: 3, name: 'Categoría C' },
]

const peiOptions = ['I', 'II', 'III', 'IV', 'V']

const form = reactive({
	supplier_id: '',
	category_id: '',
	unit_type_id: '',
	name: '',
	purchase_unit: '',
})

const errors = reactive({
	supplier_id: '',
	category_id: '',
	unit_type_id: '',
	name: '',
	purchase_unit: '',
})

const variant = reactive({
	size: '',
	pei: '',
	ett: '',
	kilos_per_box: null,
	boxes_per_pallet: null,
	commission_category_id: '',
	price_per_box: null,
	price_per_m2: null,
	pieces_per_box: null,
	m2_per_box: null,
})

const variantErrors = reactive({
	size: '',
	pei: '',
	ett: '',
	kilos_per_box: '',
	boxes_per_pallet: '',
	commission_category_id: '',
	price_per_box: '',
	price_per_m2: '',
	pieces_per_box: '',
	m2_per_box: '',
})

// Cada fila se convierte en su propia variante (POST /api/product-variants) en el paso 5,
// reutilizando los campos técnicos compartidos de arriba.
function createColorRow() {
	return {
		id: crypto.randomUUID(),
		color: '',
		stock_boxes: null,
		minimum_stock: null,
		errors: { color: '', stock_boxes: '', minimum_stock: '' },
	}
}

const colorRows = ref([createColorRow()])

function addColorRow() {
	colorRows.value.push(createColorRow())
}

function removeColorRow(id) {
	if (colorRows.value.length === 1) return
	colorRows.value = colorRows.value.filter((row) => row.id !== id)
}

const requiredFormFields = ['supplier_id', 'category_id', 'unit_type_id', 'name', 'purchase_unit']
const requiredVariantFields = [
	'size', 'pei', 'ett', 'kilos_per_box', 'boxes_per_pallet',
	'price_per_box', 'price_per_m2', 'pieces_per_box', 'm2_per_box',
]
const requiredColorRowFields = ['color', 'stock_boxes', 'minimum_stock']

const validateForm = () => {
	let isValid = true

	for (const field of requiredFormFields) {
		errors[field] = ''
		if (form[field] === '' || form[field] === null) {
			errors[field] = 'Este campo es requerido'
			isValid = false
		}
	}

	for (const field of requiredVariantFields) {
		variantErrors[field] = ''
		if (variant[field] === '' || variant[field] === null) {
			variantErrors[field] = 'Este campo es requerido'
			isValid = false
		}
	}

	for (const row of colorRows.value) {
		for (const field of requiredColorRowFields) {
			row.errors[field] = ''
			if (row[field] === '' || row[field] === null) {
				row.errors[field] = 'Este campo es requerido'
				isValid = false
			}
		}
	}

	return isValid
}

const handleSubmit = () => {
	if (!validateForm()) return

	// La conexión con la API y el router queda para un paso posterior.
}
</script>

<style scoped>

</style>
