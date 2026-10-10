<template>
	<Dialog v-model:visible="visible" modal :pt="{ mask: { class: 'bg-primary/50' } }" @show="fillForm" @hide="reset">
		<template #container="{ closeCallback }">
			<form @submit.prevent="submitCategory" class="bg-surface border border-border rounded-md p-5 w-[380px] max-w-[90vw]">
				<div class="flex items-center justify-between mb-4">
					<h3 class="font-serif text-base text-primary">{{ isEditMode ? 'Editar categoría' : 'Nueva categoría' }}</h3>
					<button type="button" @click="closeCallback" class="text-text-muted hover:text-text transition-colors" aria-label="Cerrar">
						<i class="ti ti-x text-base"></i>
					</button>
				</div>

				<div class="space-y-1.5 mb-4">
					<label for="category_name" class="text-xs font-medium text-text-muted block">Nombre</label>
					<InputTextCustom
						id="category_name"
						v-model="name"
						:error="errors.name"
						placeholder="Ej. Porcelanato"
						@input="errors.name = ''"
					/>
					<p v-if="errors.name" class="text-danger text-[12px] mt-1.5">{{ errors.name }}</p>
				</div>

				<div class="space-y-1.5 mb-4">
					<label for="category_code_prefix" class="text-xs font-medium text-text-muted block">Prefijo de código</label>
					<InputTextCustom
						id="category_code_prefix"
						v-model="codePrefix"
						:error="errors.code_prefix"
						placeholder="Ej. POR"
						@input="errors.code_prefix = ''"
					/>
					<p v-if="errors.code_prefix" class="text-danger text-[12px] mt-1.5">{{ errors.code_prefix }}</p>
				</div>

				<p v-if="generalError" class="text-danger text-[12px] mb-4">{{ generalError }}</p>

				<div class="flex items-center justify-end gap-3">
					<button
						type="button"
						@click="closeCallback"
						class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
					>
						Cancelar
					</button>
					<button
						type="submit"
						:disabled="!isValid || submitting"
						class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
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
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'

const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
	// Con una categoría el formulario edita; sin ella, crea una nueva.
	category: { type: Object, default: null },
})

const catalogs = useCatalogsStore()

const name = ref('')
const codePrefix = ref('')
const errors = reactive({ name: '', code_prefix: '' })
const generalError = ref(null)
const submitting = ref(false)

const isEditMode = computed(() => !!props.category?.id)

const isValid = computed(() => name.value.trim() !== '' && codePrefix.value.trim() !== '')

function fillForm() {
	name.value = props.category?.name ?? ''
	codePrefix.value = props.category?.code_prefix ?? ''
}

function reset() {
	name.value = ''
	codePrefix.value = ''
	errors.name = ''
	errors.code_prefix = ''
	generalError.value = null
}

async function submitCategory() {
	if (!isValid.value || submitting.value) return

	submitting.value = true
	errors.name = ''
	errors.code_prefix = ''
	generalError.value = null

	try {
		const payload = {
			name: name.value.trim(),
			code_prefix: codePrefix.value.trim(),
		}

		if (isEditMode.value) {
			const { data } = await axios.put(`/api/categories/${props.category.id}`, payload)
			catalogs.updateCategory(props.category.id, data.data)
		} else {
			const { data } = await axios.post('/api/categories', payload)
			catalogs.addCategory(data.data)
		}

		visible.value = false
	} catch (err) {
		if (err.response?.status === 422) {
			const serverErrors = err.response.data.errors ?? {}
			errors.name = serverErrors.name?.[0] ?? ''
			errors.code_prefix = serverErrors.code_prefix?.[0] ?? ''
			if (!errors.name && !errors.code_prefix) {
				generalError.value = err.response.data.message || 'No se pudo guardar la categoría.'
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
