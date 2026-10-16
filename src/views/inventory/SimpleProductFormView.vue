<template>
	<div class="p-2 max-w-4xl">
		<div class="flex flex-wrap items-start justify-between gap-3 mb-4">
			<div>
				<h1 class="font-serif text-xl text-primary">{{ route.meta.title }}</h1>
				<p class="text-sm text-text-muted mt-0.5">
					{{
						isEditMode
							? "Modifica el nombre, la categoría, el precio o la descripción, y ajusta su stock."
							: "Registra un producto que se vende por unidad, como pegamentos, boquillas o herramientas. Deja el stock vacío si no quieres llevar su control."
					}}
				</p>
			</div>
			<button
				type="button"
				shrink-0
				@click="handleCancel"
				class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer inline-flex items-center gap-1.5 shrink-0"
			>
				<i class="ti ti-arrow-left text-sm"></i>
				Volver
			</button>
		</div>

		<p
			v-if="generalError"
			class="text-danger text-[13px] mb-4 flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2"
		>
			<svg
				class="w-3.5 h-3.5 shrink-0"
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
			<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
				<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">
					Datos del producto
				</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<FieldLabel html-for="category_id" text="Categoría" required />
						<!-- Crear la categoría aquí evita salir del formulario y perder lo
						     capturado. Solo con el catálogo cargado (ver CategoriesSettingsView). -->
						<div class="flex gap-2">
							<div class="flex-1 min-w-0">
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
							</div>
							<button
								type="button"
								class="shrink-0 inline-flex items-center justify-center h-10 w-10 bg-surface border border-border hover:bg-bg text-text-muted hover:text-text rounded-md transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
								aria-label="Nueva categoría"
								title="Nueva categoría"
								:disabled="!catalogs.initialized || loadingProduct"
								@click="categoryDialogVisible = true"
							>
								<i class="ti ti-plus text-base" aria-hidden="true"></i>
							</button>
						</div>
						<p v-if="errors.category_id" class="text-danger text-[12px] mt-1.5">
							{{ errors.category_id }}
						</p>
					</div>

					<!-- Capturado a mano por ahora (opcional, único). Se refleja en
					     mayúsculas al teclear; la normalización real es la del backend. -->
					<div class="space-y-1.5">
						<FieldLabel html-for="code" text="Código" />
						<InputTextCustom
							id="code"
							v-model="form.code"
							:error="errors.code"
							class="font-mono"
							maxlength="50"
							autocomplete="off"
							autocapitalize="characters"
							spellcheck="false"
							placeholder="Ej. PEG-GRIS-20KG"
							:disabled="loadingProduct"
							@input="onCodeInput"
						/>
						<p v-if="errors.code" class="text-danger text-[12px] mt-1.5">
							{{ errors.code }}
						</p>
						<p v-else class="text-text-muted text-[12px] mt-1.5">
							Opcional. Sin espacios; no se puede repetir.
						</p>
					</div>

					<div class="space-y-1.5 sm:col-span-2">
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
						<p v-if="errors.name" class="text-danger text-[12px] mt-1.5">
							{{ errors.name }}
						</p>
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
						<p v-if="errors.price" class="text-danger text-[12px] mt-1.5">
							{{ errors.price }}
						</p>
					</div>

					<!-- En edición, el cambio se aplica al guardar como ajuste con historial
					     (PATCH /stock); vacío = sin control de stock. -->
					<div class="space-y-1.5">
						<FieldLabel
							html-for="stock_quantity"
							:text="isEditMode ? 'Stock actual (unidades)' : 'Stock inicial (unidades)'"
						/>
						<InputNumberCustom
							id="stock_quantity"
							v-model="form.stock_quantity"
							:error="errors.stock_quantity"
							:min="0"
							:max-fraction-digits="0"
							placeholder="Sin control"
							:disabled="loadingProduct"
							@input="errors.stock_quantity = ''"
						/>
						<p v-if="errors.stock_quantity" class="text-danger text-[12px] mt-1.5">
							{{ errors.stock_quantity }}
						</p>
						<p v-else-if="stockChange" class="text-text-muted text-[12px] mt-1.5">
							{{ describeStockChange(originalStock, form.stock_quantity, "unidades") }}
						</p>
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
						<p v-if="errors.description" class="text-danger text-[12px] mt-1.5">
							{{ errors.description }}
						</p>
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

		<StockChangesConfirmDialog />

		<CategoryFormDialog
			v-model:visible="categoryDialogVisible"
			fixed-product-form-type="simple"
			@saved="onCategoryCreated"
		/>
	</div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useConfirm } from "primevue/useconfirm";
import axios from "@/lib/axios";
import { useCatalogsStore } from "@/stores/catalogs";
import { useSimpleProductsStore } from "@/stores/simpleProducts";
import SelectCustom from "@/components/widgets/SelectCustom.vue";
import InputTextCustom from "@/components/widgets/InputTextCustom.vue";
import InputNumberCustom from "@/components/widgets/InputNumberCustom.vue";
import TextareaCustom from "@/components/widgets/TextareaCustom.vue";
import FieldLabel from "@/components/widgets/labels/FieldLabel.vue";
import { confirmStockChanges, describeStockChange, stockChangePayload } from "@/lib/stockChange";
import StockChangesConfirmDialog from "./components/StockChangesConfirmDialog.vue";
import CategoryFormDialog from "@/components/widgets/dialogs/CategoryFormDialog.vue";

const route = useRoute();
const router = useRouter();
const catalogs = useCatalogsStore();
const simpleProducts = useSimpleProductsStore();
const confirm = useConfirm();

const isEditMode = computed(() => !!route.params.id);
const loadingProduct = ref(false);
// Mismo criterio que CustomerFormView: si la precarga falla en edición no hay
// nada válido que guardar, así que el submit queda deshabilitado.
const loadFailed = ref(false);

// El backend rechaza (422) un producto simple en una categoría de tipo 'variant'.
const simpleCategories = computed(() =>
	catalogs.categories.filter((c) => c.product_form_type === "simple"),
);

const categoryDialogVisible = ref(false);

// La categoría recién creada queda seleccionada: es para lo que se abrió el diálogo.
function onCategoryCreated(category) {
	form.category_id = category.id;
	errors.category_id = "";
}

const form = reactive({
	category_id: "",
	code: "",
	name: "",
	price: null,
	description: "",
	// Al crear viaja como stock inicial; en edición se compara contra
	// `originalStock` y se aplica como ajuste. Vacío (null) = sin control.
	stock_quantity: null,
});

const errors = reactive({
	category_id: "",
	code: "",
	name: "",
	price: "",
	description: "",
	stock_quantity: "",
});

// Stock con el que se cargó el producto en edición. El update general ignora el
// stock: solo cambia vía PATCH /stock, que deja historial.
const originalStock = ref(null);

const stockChange = computed(() =>
	isEditMode.value ? stockChangePayload(originalStock.value, form.stock_quantity) : null,
);

const submitting = ref(false);
const generalError = ref(null);

onMounted(() => {
	if (!catalogs.initialized) catalogs.fetchCatalogs();
	if (isEditMode.value) loadProduct();
});

async function loadProduct() {
	loadingProduct.value = true;

	try {
		const product = await simpleProducts.fetchSimpleProduct(route.params.id);
		form.category_id = product.category_id;
		form.code = product.code ?? "";
		form.name = product.name;
		form.price = product.price;
		form.description = product.description ?? "";
		form.stock_quantity = product.stock_quantity;
		originalStock.value = product.stock_quantity;
	} catch (err) {
		console.error(err);
		generalError.value =
			err.response?.status === 404
				? "El producto no existe."
				: "No se pudo cargar el producto.";
		loadFailed.value = true;
	} finally {
		loadingProduct.value = false;
	}
}

// Corre después del update general. Si sale bien, `originalStock` se actualiza
// para que un reintento no repita el ajuste. Devuelve el mensaje de error o null.
async function applyStockChange(payload) {
	try {
		const { data } = await axios.patch(`/api/simple-products/${route.params.id}/stock`, payload);
		const { stock_quantity } = data.data;
		form.stock_quantity = stock_quantity;
		originalStock.value = stock_quantity;
		simpleProducts.updateSimpleProductStock(route.params.id, { stock_quantity });
		return null;
	} catch (err) {
		console.error(err);
		return err.response?.data?.message ?? "error inesperado";
	}
}

const requiredFields = ["category_id", "name", "price"];

function validateForm() {
	let isValid = true;

	for (const field of requiredFields) {
		const value = typeof form[field] === "string" ? form[field].trim() : form[field];
		errors[field] = value === "" || value === null ? "Este campo es requerido" : "";
		if (errors[field]) isValid = false;
	}

	if (/\s/.test(form.code.trim())) {
		errors.code = "El código no puede llevar espacios";
		isValid = false;
	}

	return isValid;
}

// Mismo criterio que el prefijo en CategoryFormDialog: se refleja en mayúsculas
// al teclear, conservando la posición del cursor.
function onCodeInput(event) {
	errors.code = "";
	const input = event.target;
	const upper = input.value.toUpperCase();
	if (upper !== input.value) {
		const { selectionStart, selectionEnd } = input;
		input.value = upper;
		input.setSelectionRange(selectionStart, selectionEnd);
	}
	form.code = upper;
}

function applyServerErrors(serverErrors) {
	for (const field of Object.keys(serverErrors)) {
		if (field in errors) {
			errors[field] = serverErrors[field][0];
		}
	}
	// Los mensajes de validación del backend llegan en inglés (ver Pendientes en
	// PROJECT.md). Espacios y largo ya se validan aquí, así que el que queda es
	// el de código repetido.
	if (serverErrors.code) errors.code = "Ya existe otro producto con este código.";
}

async function handleSubmit() {
	if (!validateForm()) return;

	const stockPayload = stockChange.value;
	if (stockPayload) {
		const confirmed = await confirmStockChanges(confirm, [
			{
				label: form.name.trim(),
				description: describeStockChange(originalStock.value, form.stock_quantity, "unidades"),
			},
		]);
		if (!confirmed) return;
	}

	generalError.value = null;
	submitting.value = true;

	const payload = {
		category_id: form.category_id,
		code: form.code.trim() || null,
		name: form.name.trim(),
		price: form.price,
		description: form.description.trim() || null,
	};

	try {
		if (isEditMode.value) {
			await simpleProducts.updateSimpleProduct(route.params.id, payload);

			if (stockPayload) {
				const stockError = await applyStockChange(stockPayload);
				if (stockError) {
					generalError.value = `Se guardaron los cambios, pero no se pudo ajustar el stock (${stockError}).`;
					return;
				}
			}
		} else {
			await simpleProducts.createSimpleProduct({
				...payload,
				stock_quantity: form.stock_quantity,
			});
		}

		router.push({ name: "inventory", query: { seccion: "otros" } });
	} catch (err) {
		// El 422 de "categoría que no admite productos simples" llega sin `errors`,
		// solo con `message`.
		if (err.response?.status === 422 && err.response.data.errors) {
			applyServerErrors(err.response.data.errors);
		} else {
			console.error(err);
			generalError.value =
				err.response?.data?.message || "No se pudo guardar el producto. Intenta de nuevo.";
		}
	} finally {
		submitting.value = false;
	}
}

function handleCancel() {
	router.push({ name: "inventory", query: { seccion: "otros" } });
}
</script>

<style scoped></style>
