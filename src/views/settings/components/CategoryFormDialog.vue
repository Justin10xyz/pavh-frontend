<template>
	<Dialog v-model:visible="visible" modal :pt="{ mask: { class: 'bg-primary/50' } }" @show="fillForm" @hide="reset">
		<template #container="{ closeCallback }">
			<form @submit.prevent="submitCategory" class="bg-surface border border-border rounded-md p-4 sm:p-5 w-110 max-w-[90vw]">
				<div class="flex items-center justify-between mb-4">
					<h3 class="font-serif text-base text-primary">{{ isEditMode ? 'Editar categoría' : 'Nueva categoría' }}</h3>
					<button
						type="button"
						@click="closeCallback"
						class="text-text-muted hover:text-text transition-colors cursor-pointer"
						aria-label="Cerrar"
					>
						<i class="ti ti-x text-base" aria-hidden="true"></i>
					</button>
				</div>

				<div class="space-y-1.5 mb-4">
					<FieldLabel html-for="category_name" text="Nombre" required />
					<InputTextCustom
						id="category_name"
						v-model="name"
						:error="errors.name"
						placeholder="Ej. Porcelanato"
						@input="errors.name = ''"
					/>
					<p v-if="errors.name" class="text-danger text-xs mt-1.5">{{ errors.name }}</p>
				</div>

				<div class="space-y-1.5 mb-4">
					<FieldLabel html-for="category_code_prefix" text="Prefijo de código" required />
					<InputTextCustom
						id="category_code_prefix"
						v-model="codePrefix"
						:error="errors.code_prefix"
						placeholder="Ej. POR"
						autocomplete="off"
						autocapitalize="characters"
						spellcheck="false"
						@input="onCodePrefixInput"
					/>
					<p v-if="errors.code_prefix" class="text-danger text-xs mt-1.5">{{ errors.code_prefix }}</p>
					<p v-else-if="codePrefixChanged" class="text-xs text-text-muted mt-1.5">
						Los productos ya creados conservan su código actual ({{ category.code_prefix }}-…); solo los nuevos usarán {{ codePrefix.trim() }}.
					</p>
				</div>

				<div class="space-y-1.5 mb-4">
					<FieldLabel html-for="category_product_form_type" text="Tipo de formulario de producto" required />
					<SelectCustom
						id="category_product_form_type"
						v-model="productFormType"
						:options="productFormTypeOptions"
						option-value="value"
						option-label="label"
						:error="errors.product_form_type"
						@change="errors.product_form_type = ''"
					/>
					<p v-if="errors.product_form_type" class="text-danger text-xs mt-1.5">{{ errors.product_form_type }}</p>
					<p v-else class="text-xs text-text-muted mt-1.5">
						{{ productFormTypeDescription }}
						<template v-if="isEditMode">No se puede cambiar si la categoría ya tiene productos.</template>
					</p>
				</div>

				<p v-if="generalError" class="text-danger text-xs mb-4" role="alert">{{ generalError }}</p>

				<div class="flex items-center justify-end gap-3">
					<button
						type="button"
						@click="closeCallback"
						class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
					>
						Cancelar
					</button>
					<button
						type="submit"
						:disabled="submitting"
						class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer disabled:cursor-not-allowed"
					>
						{{ submitting ? 'Guardando…' : (isEditMode ? 'Guardar cambios' : 'Guardar') }}
					</button>
				</div>
			</form>
		</template>
	</Dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import Dialog from 'primevue/dialog'
import axios from '@/lib/axios'
import { useCatalogsStore } from '@/stores/catalogs'
import { useNotify } from '@/composables/useNotify'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'
import SelectCustom from '@/components/widgets/SelectCustom.vue'
import FieldLabel from '@/components/widgets/labels/FieldLabel.vue'
import { DEFAULT_PRODUCT_FORM_TYPE, PRODUCT_FORM_TYPE_OPTIONS } from '@/lib/productFormTypes'

const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
	// Con una categoría el formulario edita; sin ella, crea una nueva.
	category: { type: Object, default: null },
})

const catalogs = useCatalogsStore()
const notify = useNotify()

// Define qué formulario de producto usa la categoría.
const productFormTypeOptions = PRODUCT_FORM_TYPE_OPTIONS

const name = ref('')
const codePrefix = ref('')
const productFormType = ref(DEFAULT_PRODUCT_FORM_TYPE)
const errors = reactive({ name: '', code_prefix: '', product_form_type: '' })
const generalError = ref(null)
const submitting = ref(false)

const isEditMode = computed(() => !!props.category?.id)

// El prefijo solo se usa al generar el código de una variante nueva
// (VariantCodeGenerator), así que cambiarlo no toca los códigos existentes.
const codePrefixChanged = computed(
	() => isEditMode.value && codePrefix.value.trim() !== '' && codePrefix.value.trim() !== props.category.code_prefix
)

const productFormTypeDescription = computed(
	() => productFormTypeOptions.find((option) => option.value === productFormType.value)?.description ?? ''
)

// El backend guarda el prefijo en mayúsculas (forma parte del código de cada
// variante); aquí solo se refleja al teclear para que se vea lo que se va a
// guardar. Se conserva la posición del cursor por si se edita a la mitad.
function onCodePrefixInput(event) {
	errors.code_prefix = ''
	const input = event.target
	const upper = input.value.toUpperCase()
	if (upper !== input.value) {
		const { selectionStart, selectionEnd } = input
		input.value = upper
		input.setSelectionRange(selectionStart, selectionEnd)
	}
	codePrefix.value = upper
}

function fillForm() {
	name.value = props.category?.name ?? ''
	codePrefix.value = props.category?.code_prefix ?? ''
	productFormType.value = props.category?.product_form_type ?? DEFAULT_PRODUCT_FORM_TYPE
	// Sin esto el foco cae en el botón de cerrar (el primer enfocable del diálogo).
	document.getElementById('category_name')?.focus()
}

function reset() {
	name.value = ''
	codePrefix.value = ''
	productFormType.value = DEFAULT_PRODUCT_FORM_TYPE
	errors.name = ''
	errors.code_prefix = ''
	errors.product_form_type = ''
	generalError.value = null
}

// Mismo criterio que los forms de Clientes: el botón queda habilitado y lo que
// falta se marca en su campo al intentar guardar, en vez de un botón gris sin
// explicación.
function validateRequired() {
	errors.name = name.value.trim() ? '' : 'Este campo es requerido'
	errors.code_prefix = codePrefix.value.trim() ? '' : 'Este campo es requerido'
	return !errors.name && !errors.code_prefix
}

async function submitCategory() {
	if (submitting.value) return

	errors.product_form_type = ''
	generalError.value = null
	if (!validateRequired()) return

	submitting.value = true

	try {
		const payload = {
			name: name.value.trim(),
			code_prefix: codePrefix.value.trim(),
			product_form_type: productFormType.value,
		}

		if (isEditMode.value) {
			const { data } = await axios.put(`/api/categories/${props.category.id}`, payload)
			catalogs.updateCategory(props.category.id, data.data)
			notify.success('Categoría actualizada', data.data.name)
		} else {
			const { data } = await axios.post('/api/categories', payload)
			catalogs.addCategory(data.data)
			notify.success('Categoría guardada', data.data.name)
		}

		visible.value = false
	} catch (err) {
		if (err.response?.status === 422) {
			const serverErrors = err.response.data.errors ?? {}
			errors.name = serverErrors.name?.[0] ?? ''
			errors.code_prefix = serverErrors.code_prefix?.[0] ?? ''
			errors.product_form_type = serverErrors.product_form_type?.[0] ?? ''
			if (!errors.name && !errors.code_prefix && !errors.product_form_type) {
				const message = err.response.data.message || 'No se pudo guardar la categoría.'
				// El bloqueo de cambio de tipo (Category::productFormTypeChangeBlockedMessage)
				// llega sin `errors`; si el tipo cambió, el error es de ese campo.
				if (isEditMode.value && productFormType.value !== props.category.product_form_type) {
					errors.product_form_type = message
				} else {
					generalError.value = message
				}
			}
		} else {
			generalError.value = err.response?.data?.message || 'No se pudo guardar la categoría. Intenta de nuevo.'
		}
	} finally {
		submitting.value = false
	}
}
</script>

<style scoped></style>
