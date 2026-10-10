<template>
	<div class="p-2 max-w-4xl">
		<div class="mb-4">
			<h1 class="font-serif text-xl text-primary">{{ route.meta.title }}</h1>
			<p class="text-sm text-text-muted mt-0.5">
				{{
					isEditMode
						? "Actualiza los datos de la línea y sus variantes."
						: "Captura la línea de producto junto con su primera variante."
				}}
			</p>
		</div>

		<p
			v-if="generalError"
			class="text-danger text-[13px] mb-4 flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2"
		>
			<svg
				class="w-3.5 h-3.5 flex-shrink-0"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="2"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
			{{ generalError }}
		</p>

		<form @submit.prevent="handleSubmit" class="space-y-4">
			<!-- Sección 1 — Datos del producto (línea) -->
			<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
				<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">
					Datos del producto (línea)
				</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label for="supplier_id" class="text-xs font-medium text-text-muted block"
							>Proveedor</label
						>
						<select
							id="supplier_id"
							v-model="form.supplier_id"
							:disabled="catalogs.loading"
							@change="errors.supplier_id = ''"
							class="w-full bg-surface border text-sm text-text focus:outline-none transition-colors px-3 h-[38px] rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
							:class="
								errors.supplier_id
									? 'border-danger focus:border-danger'
									: 'border-border focus:border-accent'
							"
						>
							<option value="" disabled>
								{{ catalogs.loading ? "Cargando…" : "Selecciona un proveedor" }}
							</option>
							<option
								v-for="supplier in catalogs.suppliers"
								:key="supplier.id"
								:value="supplier.id"
							>
								{{ supplier.name }}
							</option>
						</select>
						<p v-if="errors.supplier_id" class="text-danger text-[12px] mt-1.5">
							{{ errors.supplier_id }}
						</p>
					</div>

					<div class="space-y-1.5">
						<label for="category_id" class="text-xs font-medium text-text-muted block"
							>Categoría</label
						>
						<select
							id="category_id"
							v-model="form.category_id"
							:disabled="catalogs.loading"
							@change="errors.category_id = ''"
							class="w-full bg-surface border text-sm text-text focus:outline-none transition-colors px-3 h-[38px] rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
							:class="
								errors.category_id
									? 'border-danger focus:border-danger'
									: 'border-border focus:border-accent'
							"
						>
							<option value="" disabled>
								{{ catalogs.loading ? "Cargando…" : "Selecciona una categoría" }}
							</option>
							<option
								v-for="category in catalogs.categories"
								:key="category.id"
								:value="category.id"
							>
								{{ category.name }}
							</option>
						</select>
						<p v-if="errors.category_id" class="text-danger text-[12px] mt-1.5">
							{{ errors.category_id }}
						</p>
					</div>

					<div class="space-y-1.5">
						<label for="name" class="text-xs font-medium text-text-muted block"
							>Nombre</label
						>
						<input
							id="name"
							v-model="form.name"
							type="text"
							placeholder="Ej. Porcelanato Carrara"
							@input="errors.name = ''"
							class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="
								errors.name
									? 'border-danger focus:border-danger'
									: 'border-border focus:border-accent'
							"
						/>
						<p v-if="errors.name" class="text-danger text-[12px] mt-1.5">
							{{ errors.name }}
						</p>
					</div>

					<div class="space-y-1.5">
						<label for="unit_type_id" class="text-xs font-medium text-text-muted block"
							>Unidad</label
						>
						<select
							id="unit_type_id"
							v-model="form.unit_type_id"
							:disabled="catalogs.loading"
							@change="errors.unit_type_id = ''"
							class="w-full bg-surface border text-sm text-text focus:outline-none transition-colors px-3 h-[38px] rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
							:class="
								errors.unit_type_id
									? 'border-danger focus:border-danger'
									: 'border-border focus:border-accent'
							"
						>
							<option value="" disabled>
								{{ catalogs.loading ? "Cargando…" : "Selecciona una unidad" }}
							</option>
							<option
								v-for="unitType in catalogs.unitTypes"
								:key="unitType.id"
								:value="unitType.id"
							>
								{{ unitType.name }}
							</option>
						</select>
						<p v-if="errors.unit_type_id" class="text-danger text-[12px] mt-1.5">
							{{ errors.unit_type_id }}
						</p>
					</div>

					<div class="space-y-1.5">
						<label for="purchase_unit" class="text-xs font-medium text-text-muted block"
							>Unidad de compra</label
						>
						<input
							id="purchase_unit"
							v-model="form.purchase_unit"
							type="text"
							placeholder="Ej. Caja"
							@input="errors.purchase_unit = ''"
							class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="
								errors.purchase_unit
									? 'border-danger focus:border-danger'
									: 'border-border focus:border-accent'
							"
						/>
						<p v-if="errors.purchase_unit" class="text-danger text-[12px] mt-1.5">
							{{ errors.purchase_unit }}
						</p>
					</div>
				</div>
			</div>

			<!-- Sección 2 — Datos de la variante inicial -->
			<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
				<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">
					Datos de la variante inicial
				</h2>

				<!-- Grupo 1 — Medida y especificaciones técnicas -->
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div class="space-y-1.5">
						<label for="size" class="text-xs font-medium text-text-muted block"
							>Medida</label
						>
						<input
							id="size"
							v-model="variant.size"
							type="text"
							placeholder="Ej. 60X120"
							@input="variantErrors.size = ''"
							class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="
								variantErrors.size
									? 'border-danger focus:border-danger'
									: 'border-border focus:border-accent'
							"
						/>
						<p v-if="variantErrors.size" class="text-danger text-[12px] mt-1.5">
							{{ variantErrors.size }}
						</p>
					</div>

					<div class="space-y-1.5">
						<label for="pei" class="text-xs font-medium text-text-muted block"
							>PEI</label
						>
						<select
							id="pei"
							v-model="variant.pei"
							@change="variantErrors.pei = ''"
							class="w-full bg-surface border text-sm text-text focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="
								variantErrors.pei
									? 'border-danger focus:border-danger'
									: 'border-border focus:border-accent'
							"
						>
							<option value="" disabled>Selecciona un PEI</option>
							<option v-for="option in peiOptions" :key="option" :value="option">
								{{ option }}
							</option>
						</select>
						<p v-if="variantErrors.pei" class="text-danger text-[12px] mt-1.5">
							{{ variantErrors.pei }}
						</p>
					</div>

					<div class="space-y-1.5">
						<label for="ett" class="text-xs font-medium text-text-muted block"
							>ETT</label
						>
						<input
							id="ett"
							v-model="variant.ett"
							type="text"
							placeholder="Ej. 1"
							@input="variantErrors.ett = ''"
							class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="
								variantErrors.ett
									? 'border-danger focus:border-danger'
									: 'border-border focus:border-accent'
							"
						/>
						<p v-if="variantErrors.ett" class="text-danger text-[12px] mt-1.5">
							{{ variantErrors.ett }}
						</p>
					</div>
				</div>

				<!-- Grupo 3 — Precio -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
					<div class="space-y-1.5">
						<label for="price_per_box" class="text-xs font-medium text-text-muted block"
							>Precio por caja</label
						>
						<div class="relative">
							<span
								class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted text-sm"
								>$</span
							>
							<input
								id="price_per_box"
								v-model.number="variant.price_per_box"
								type="number"
								min="0"
								step="0.01"
								placeholder="0.00"
								@input="variantErrors.price_per_box = ''"
								class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors pl-6 pr-3 h-[38px] rounded-md"
								:class="
									variantErrors.price_per_box
										? 'border-danger focus:border-danger'
										: 'border-border focus:border-accent'
								"
							/>
						</div>
						<p
							v-if="variantErrors.price_per_box"
							class="text-danger text-[12px] mt-1.5"
						>
							{{ variantErrors.price_per_box }}
						</p>
					</div>

					<div class="space-y-1.5">
						<label for="price_per_m2" class="text-xs font-medium text-text-muted block"
							>Precio por m²</label
						>
						<div class="relative">
							<span
								class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted text-sm"
								>$</span
							>
							<input
								id="price_per_m2"
								v-model.number="variant.price_per_m2"
								type="number"
								min="0"
								step="0.01"
								placeholder="0.00"
								@input="variantErrors.price_per_m2 = ''"
								class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors pl-6 pr-3 h-[38px] rounded-md"
								:class="
									variantErrors.price_per_m2
										? 'border-danger focus:border-danger'
										: 'border-border focus:border-accent'
								"
							/>
						</div>
						<p v-if="variantErrors.price_per_m2" class="text-danger text-[12px] mt-1.5">
							{{ variantErrors.price_per_m2 }}
						</p>
					</div>
				</div>

				<!-- Grupo 2 — Datos por caja -->
				<div
					class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 border-t border-border pt-4"
				>
					<div class="space-y-1.5">
						<label
							for="pieces_per_box"
							class="text-xs font-medium text-text-muted block"
							>Piezas por caja</label
						>
						<input
							id="pieces_per_box"
							v-model.number="variant.pieces_per_box"
							type="number"
							min="0"
							step="1"
							placeholder="0"
							@input="variantErrors.pieces_per_box = ''"
							class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="
								variantErrors.pieces_per_box
									? 'border-danger focus:border-danger'
									: 'border-border focus:border-accent'
							"
						/>
						<p
							v-if="variantErrors.pieces_per_box"
							class="text-danger text-[12px] mt-1.5"
						>
							{{ variantErrors.pieces_per_box }}
						</p>
					</div>

					<div class="space-y-1.5">
						<label for="kilos_per_box" class="text-xs font-medium text-text-muted block"
							>Kilos por caja</label
						>
						<input
							id="kilos_per_box"
							v-model.number="variant.kilos_per_box"
							type="number"
							min="0"
							step="0.01"
							placeholder="0.00"
							@input="variantErrors.kilos_per_box = ''"
							class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="
								variantErrors.kilos_per_box
									? 'border-danger focus:border-danger'
									: 'border-border focus:border-accent'
							"
						/>
						<p
							v-if="variantErrors.kilos_per_box"
							class="text-danger text-[12px] mt-1.5"
						>
							{{ variantErrors.kilos_per_box }}
						</p>
					</div>

					<div class="space-y-1.5">
						<label for="m2_per_box" class="text-xs font-medium text-text-muted block"
							>m² por caja</label
						>
						<input
							id="m2_per_box"
							v-model.number="variant.m2_per_box"
							type="number"
							min="0"
							step="0.01"
							placeholder="0.00"
							@input="variantErrors.m2_per_box = ''"
							class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="
								variantErrors.m2_per_box
									? 'border-danger focus:border-danger'
									: 'border-border focus:border-accent'
							"
						/>
						<p v-if="variantErrors.m2_per_box" class="text-danger text-[12px] mt-1.5">
							{{ variantErrors.m2_per_box }}
						</p>
					</div>

					<div class="space-y-1.5">
						<label
							for="boxes_per_pallet"
							class="text-xs font-medium text-text-muted block"
							>Cajas por tarima</label
						>
						<input
							id="boxes_per_pallet"
							v-model.number="variant.boxes_per_pallet"
							type="number"
							min="0"
							step="1"
							placeholder="0"
							@input="variantErrors.boxes_per_pallet = ''"
							class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
							:class="
								variantErrors.boxes_per_pallet
									? 'border-danger focus:border-danger'
									: 'border-border focus:border-accent'
							"
						/>
						<p
							v-if="variantErrors.boxes_per_pallet"
							class="text-danger text-[12px] mt-1.5"
						>
							{{ variantErrors.boxes_per_pallet }}
						</p>
					</div>
				</div>

				<!-- Grupo 4 — Dato interno del negocio, separado del resto (no viene de la hoja del proveedor) -->
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
					<div class="space-y-1.5">
						<label
							for="commission_category_id"
							class="text-xs font-medium text-text-muted block"
							>Categoría de comisión</label
						>
						<select
							id="commission_category_id"
							v-model="variant.commission_category_id"
							:disabled="catalogs.loading"
							@change="variantErrors.commission_category_id = ''"
							class="w-full bg-surface border text-sm text-text focus:outline-none transition-colors px-3 h-[38px] rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
							:class="
								variantErrors.commission_category_id
									? 'border-danger focus:border-danger'
									: 'border-border focus:border-accent'
							"
						>
							<option value="">
								{{ catalogs.loading ? "Cargando…" : "Sin categoría" }}
							</option>
							<option
								v-for="commissionCategory in catalogs.commissionCategories"
								:key="commissionCategory.id"
								:value="commissionCategory.id"
							>
								{{ commissionCategory.code }}
							</option>
						</select>
						<p
							v-if="variantErrors.commission_category_id"
							class="text-danger text-[12px] mt-1.5"
						>
							{{ variantErrors.commission_category_id }}
						</p>
					</div>
				</div>

				<!-- Colores — lista repetible: cada fila se convierte en su propia variante -->
				<div class="mt-6">
					<h3
						class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-3"
					>
						Colores
					</h3>

					<div class="space-y-3">
						<div
							v-for="(row, index) in colorRows"
							:key="row.id"
							class="border border-border rounded-md p-4"
						>
							<div class="flex items-center justify-between mb-3">
								<span class="text-xs font-medium text-text-muted"
									>Color {{ index + 1 }}</span
								>
								<button
									type="button"
									@click="removeColorRow(row.id)"
									:disabled="colorRows.length === 1 || deletingRowId === row.id"
									class="text-text-muted hover:text-danger disabled:opacity-30 disabled:hover:text-text-muted disabled:cursor-not-allowed transition-colors"
									aria-label="Eliminar color"
									title="Eliminar color"
								>
									<svg
										class="w-4 h-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M6 6l12 12M6 18L18 6"
										/>
									</svg>
								</button>
							</div>

							<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div class="space-y-1.5">
									<label
										:for="`color-${row.id}`"
										class="text-xs font-medium text-text-muted block"
										>Color</label
									>
									<input
										:id="`color-${row.id}`"
										v-model="row.color"
										type="text"
										placeholder="Ej. Blanco"
										@input="row.errors.color = ''"
										class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
										:class="
											row.errors.color
												? 'border-danger focus:border-danger'
												: 'border-border focus:border-accent'
										"
									/>
									<p
										v-if="row.errors.color"
										class="text-danger text-[12px] mt-1.5"
									>
										{{ row.errors.color }}
									</p>
								</div>

								<div class="space-y-1.5">
									<label
										:for="`stock_boxes-${row.id}`"
										class="text-xs font-medium text-text-muted block"
										>Stock inicial (cajas)</label
									>
									<input
										:id="`stock_boxes-${row.id}`"
										v-model.number="row.stock_boxes"
										type="number"
										min="0"
										step="1"
										placeholder="0"
										@input="row.errors.stock_boxes = ''"
										class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
										:class="
											row.errors.stock_boxes
												? 'border-danger focus:border-danger'
												: 'border-border focus:border-accent'
										"
									/>
									<p
										v-if="row.errors.stock_boxes"
										class="text-danger text-[12px] mt-1.5"
									>
										{{ row.errors.stock_boxes }}
									</p>
								</div>

								<div class="space-y-1.5">
									<label
										:for="`minimum_stock-${row.id}`"
										class="text-xs font-medium text-text-muted block"
										>Stock mínimo</label
									>
									<input
										:id="`minimum_stock-${row.id}`"
										v-model.number="row.minimum_stock"
										type="number"
										min="0"
										step="1"
										placeholder="0"
										@input="row.errors.minimum_stock = ''"
										class="w-full bg-surface border text-sm text-text placeholder-text-muted focus:outline-none transition-colors px-3 h-[38px] rounded-md"
										:class="
											row.errors.minimum_stock
												? 'border-danger focus:border-danger'
												: 'border-border focus:border-accent'
										"
									/>
									<p
										v-if="row.errors.minimum_stock"
										class="text-danger text-[12px] mt-1.5"
									>
										{{ row.errors.minimum_stock }}
									</p>
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
					@click="handleCancel"
					class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
				>
					Cancelar
				</button>
				<button
					type="submit"
					:disabled="submitting || loadingProduct"
					class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
				>
					{{
						submitting
							? "Guardando…"
							: isEditMode
								? "Guardar cambios"
								: "Guardar producto"
					}}
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
							class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
						>
							Cancelar
						</button>
						<button
							type="button"
							@click="acceptCallback"
							class="bg-danger hover:bg-danger/90 text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
						>
							Eliminar
						</button>
					</div>
				</div>
			</template>
		</ConfirmDialog>
	</div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import axios from "@/lib/axios";
import { useCatalogsStore } from "@/stores/catalogs";
import { useInventoryStore } from "@/stores/inventory";

const route = useRoute();
const router = useRouter();
const confirm = useConfirm();
const catalogs = useCatalogsStore();
const inventory = useInventoryStore();

const isEditMode = computed(() => !!route.params.id);
const loadingProduct = ref(false);

onMounted(() => {
	if (!catalogs.initialized) catalogs.fetchCatalogs();
	if (isEditMode.value) fetchProduct();
});

const peiOptions = ["I", "II", "III", "IV", "V"];

const form = reactive({
	supplier_id: "",
	category_id: "",
	unit_type_id: "",
	name: "",
	purchase_unit: "",
});

const errors = reactive({
	supplier_id: "",
	category_id: "",
	unit_type_id: "",
	name: "",
	purchase_unit: "",
});

const variant = reactive({
	size: "",
	pei: "",
	ett: "",
	kilos_per_box: null,
	boxes_per_pallet: null,
	commission_category_id: "",
	price_per_box: null,
	price_per_m2: null,
	pieces_per_box: null,
	m2_per_box: null,
});

const variantErrors = reactive({
	size: "",
	pei: "",
	ett: "",
	kilos_per_box: "",
	boxes_per_pallet: "",
	commission_category_id: "",
	price_per_box: "",
	price_per_m2: "",
	pieces_per_box: "",
	m2_per_box: "",
});

// Cada fila se convierte en su propia variante (POST/PUT /api/product-variants). `id` es
// solo la key local para el v-for; `variantId` es el id real en backend (null si la fila
// es nueva en esta sesión de edición) y decide POST vs. PUT al guardar.
function createColorRow({
	variantId = null,
	color = "",
	stock_boxes = null,
	minimum_stock = null,
} = {}) {
	return {
		id: crypto.randomUUID(),
		variantId,
		color,
		stock_boxes,
		minimum_stock,
		errors: { color: "", stock_boxes: "", minimum_stock: "" },
	};
}

const colorRows = ref([createColorRow()]);
const deletingRowId = ref(null);

function addColorRow() {
	colorRows.value.push(createColorRow());
}

// Filas sin `variantId` son nuevas en esta sesión (o el flujo de creación, donde
// ninguna fila lo tiene) — se quitan del array local sin tocar el backend. Filas con
// `variantId` ya existen como variante real, así que requieren confirmación y un
// DELETE inmediato (no esperan al submit del form).
function removeColorRow(id) {
	if (colorRows.value.length === 1) return;

	const row = colorRows.value.find((r) => r.id === id);
	if (!row) return;

	if (!row.variantId) {
		colorRows.value = colorRows.value.filter((r) => r.id !== id);
		return;
	}

	confirm.require({
		header: "Eliminar variante",
		message: `¿Eliminar el color "${row.color}"? Esta acción no se puede deshacer.`,
		accept: () => deleteVariantRow(row),
	});
}

async function deleteVariantRow(row) {
	deletingRowId.value = row.id;
	generalError.value = null;

	try {
		await axios.delete(`/api/product-variants/${row.variantId}`);
		colorRows.value = colorRows.value.filter((r) => r.id !== row.id);
	} catch (err) {
		if (err.response?.status === 422) {
			generalError.value = err.response.data.message;
		} else {
			generalError.value = "No se pudo eliminar la variante. Intenta de nuevo.";
		}
	} finally {
		deletingRowId.value = null;
	}
}

// El form solo soporta una ficha técnica compartida por todas las filas de color (igual
// que en creación), así que en edición se toma la de la primera variante como base.
// Mismos nombres de campo que usa groupVariants.js para leer una variante.
function populateFormFromProduct(product) {
	form.supplier_id = product.supplier_id;
	form.category_id = product.category_id;
	form.unit_type_id = product.unit_type_id;
	form.name = product.name;
	form.purchase_unit = product.purchase_unit;

	const [firstVariant] = product.variants ?? [];
	if (firstVariant) {
		variant.size = firstVariant.size;
		variant.pei = firstVariant.pei;
		variant.ett = firstVariant.ett;
		variant.kilos_per_box = firstVariant.kilos_per_box;
		variant.boxes_per_pallet = firstVariant.boxes_per_pallet;
		variant.commission_category_id = firstVariant.commission_category?.id ?? "";
		variant.price_per_box = firstVariant.price_per_box;
		variant.price_per_m2 = firstVariant.price_per_m2;
		variant.pieces_per_box = firstVariant.pieces_per_box;
		variant.m2_per_box = firstVariant.m2_per_box;
	}

	if (product.variants?.length) {
		colorRows.value = product.variants.map((v) =>
			createColorRow({
				variantId: v.id,
				color: v.color,
				stock_boxes: v.stock_boxes,
				minimum_stock: v.minimum_stock,
			}),
		);
	}
}

async function fetchProduct() {
	loadingProduct.value = true;

	try {
		const { data } = await axios.get(`/api/products/${route.params.id}`, {
			params: { with: "variants" },
		});
		populateFormFromProduct(data.data);
	} catch (err) {
		console.error(err);
		generalError.value = "No se pudo cargar el producto.";
	} finally {
		loadingProduct.value = false;
	}
}

const requiredFormFields = ["supplier_id", "category_id", "unit_type_id", "name", "purchase_unit"];
const requiredVariantFields = [
	"size",
	"pei",
	"ett",
	"kilos_per_box",
	"boxes_per_pallet",
	"price_per_box",
	"price_per_m2",
	"pieces_per_box",
	"m2_per_box",
];
const requiredColorRowFields = ["color", "stock_boxes", "minimum_stock"];

const validateForm = () => {
	let isValid = true;

	for (const field of requiredFormFields) {
		errors[field] = "";
		if (form[field] === "" || form[field] === null) {
			errors[field] = "Este campo es requerido";
			isValid = false;
		}
	}

	for (const field of requiredVariantFields) {
		variantErrors[field] = "";
		if (variant[field] === "" || variant[field] === null) {
			variantErrors[field] = "Este campo es requerido";
			isValid = false;
		}
	}

	for (const row of colorRows.value) {
		for (const field of requiredColorRowFields) {
			row.errors[field] = "";
			if (row[field] === "" || row[field] === null) {
				row.errors[field] = "Este campo es requerido";
				isValid = false;
			}
		}
	}

	return isValid;
};

const submitting = ref(false);
const generalError = ref(null);

function buildVariantPayload(productId, row) {
	return {
		product_id: productId,
		size: variant.size,
		pei: variant.pei,
		ett: variant.ett,
		kilos_per_box: variant.kilos_per_box,
		boxes_per_pallet: variant.boxes_per_pallet,
		commission_category_id: variant.commission_category_id || null,
		price_per_box: variant.price_per_box,
		price_per_m2: variant.price_per_m2,
		pieces_per_box: variant.pieces_per_box,
		m2_per_box: variant.m2_per_box,
		color: row.color,
		stock_boxes: row.stock_boxes,
		minimum_stock: row.minimum_stock,
	};
}

// Solo mapea a `errors` los campos del producto — es lo único validado antes
// de que exista un `productId`, momento en el que aplican los 422.
function applyServerErrors(serverErrors) {
	for (const field of Object.keys(serverErrors)) {
		if (field in errors) {
			errors[field] = serverErrors[field][0];
		}
	}
}

const handleSubmit = async () => {
	if (!validateForm()) return;

	generalError.value = null;
	submitting.value = true;
	let productId = isEditMode.value ? route.params.id : null;
	let productSaved = false;

	try {
		const productPayload = {
			supplier_id: form.supplier_id,
			category_id: form.category_id,
			unit_type_id: form.unit_type_id,
			name: form.name,
			purchase_unit: form.purchase_unit,
		};

		if (isEditMode.value) {
			await axios.put(`/api/products/${productId}`, productPayload);
		} else {
			const { data } = await axios.post("/api/products", productPayload);
			productId = data.data.id;
		}
		productSaved = true;

		// Filas sin `variantId` son nuevas en esta sesión de edición (o el flujo de
		// creación, donde ninguna fila lo tiene). No se borra ninguna variante aquí
		// aunque el usuario haya quitado una fila del form — eso es el paso 5.5.
		await Promise.all(
			colorRows.value.map((row) =>
				row.variantId
					? axios.put(
							`/api/product-variants/${row.variantId}`,
							buildVariantPayload(productId, row),
						)
					: axios.post("/api/product-variants", buildVariantPayload(productId, row)),
			),
		);

		await inventory.fetchProducts();
		router.push({ name: "inventory" });
	} catch (err) {
		if (productSaved) {
			console.error(err);
			generalError.value = isEditMode.value
				? "El producto se actualizó correctamente, pero ocurrió un error al guardar una o más variantes. Revísalo desde el inventario."
				: "El producto se creó correctamente, pero ocurrió un error al guardar una o más variantes. Revísalo desde el inventario.";
		} else if (err.response?.status === 422) {
			applyServerErrors(err.response.data.errors);
		} else {
			generalError.value =
				err.response?.data?.message || "No se pudo guardar el producto. Intenta de nuevo.";
		}
	} finally {
		submitting.value = false;
	}
};

function handleCancel() {
	router.push({ name: "inventory" });
}
</script>

<style scoped></style>
