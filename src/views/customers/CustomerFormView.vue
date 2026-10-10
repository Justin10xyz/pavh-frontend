<template>
	<div class="p-2 max-w-4xl">
		<div class="mb-4">
			<h1 class="font-serif text-xl text-primary">{{ route.meta.title }}</h1>
			<p class="text-sm text-text-muted mt-0.5">
				{{ isEditMode ? 'Actualiza los datos de contacto del cliente.' : 'Captura los datos de contacto del cliente.' }}
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
				<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">Datos del cliente</h2>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5 sm:col-span-2">
						<label for="name" class="text-xs font-medium text-text-muted block">Nombre</label>
						<InputTextCustom
							id="name"
							v-model="form.name"
							:error="errors.name"
							autocomplete="off"
							placeholder="Ej. Constructora del Norte"
							:disabled="loadingCustomer"
							@input="errors.name = ''"
						/>
						<p v-if="errors.name" class="text-danger text-[12px] mt-1.5">{{ errors.name }}</p>
					</div>

					<div class="space-y-1.5">
						<label for="phone" class="text-xs font-medium text-text-muted block">
							Teléfono <span class="font-normal">(opcional)</span>
						</label>
						<InputTextCustom
							id="phone"
							v-model="form.phone"
							:error="errors.phone"
							type="tel"
							autocomplete="off"
							placeholder="Ej. 81 1234 5678"
							:disabled="loadingCustomer"
							@input="errors.phone = ''"
						/>
						<p v-if="errors.phone" class="text-danger text-[12px] mt-1.5">{{ errors.phone }}</p>
					</div>

					<div class="space-y-1.5">
						<label for="email" class="text-xs font-medium text-text-muted block">
							Correo <span class="font-normal">(opcional)</span>
						</label>
						<InputTextCustom
							id="email"
							v-model="form.email"
							:error="errors.email"
							type="email"
							autocomplete="off"
							placeholder="Ej. compras@constructora.mx"
							:disabled="loadingCustomer"
							@input="errors.email = ''"
						/>
						<p v-if="errors.email" class="text-danger text-[12px] mt-1.5">{{ errors.email }}</p>
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
					:disabled="submitting || loadingCustomer || loadFailed"
					class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer disabled:cursor-not-allowed"
				>
					{{ submitting ? 'Guardando…' : (isEditMode ? 'Guardar cambios' : 'Guardar cliente') }}
				</button>
			</div>
		</form>
	</div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCustomersStore } from '@/stores/customers'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'

const route = useRoute()
const router = useRouter()
const customers = useCustomersStore()

const isEditMode = computed(() => !!route.params.id)
const loadingCustomer = ref(false)
// Si la precarga falla en modo edición no hay nada válido que guardar: el
// form queda visible con el error, pero el submit se deshabilita.
const loadFailed = ref(false)

const form = reactive({
	name: '',
	phone: '',
	email: '',
})

const errors = reactive({
	name: '',
	phone: '',
	email: '',
})

const submitting = ref(false)
const generalError = ref(null)

onMounted(() => {
	if (isEditMode.value) loadCustomer()
})

async function loadCustomer() {
	loadingCustomer.value = true
	await customers.fetchCustomer(route.params.id)
	loadingCustomer.value = false

	const customer = customers.currentCustomer
	if (customers.currentCustomerError || !customer || String(customer.id) !== String(route.params.id)) {
		generalError.value = customers.currentCustomerError || 'No se pudo cargar el cliente.'
		loadFailed.value = true
		return
	}

	form.name = customer.name
	form.phone = customer.phone ?? ''
	form.email = customer.email ?? ''
}

// Solo lo que el backend también exige; el formato de correo lo valida el
// StoreCustomerRequest/UpdateCustomerRequest y llega como 422.
function validateForm() {
	errors.name = form.name.trim() ? '' : 'Este campo es requerido'
	return !errors.name
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
		name: form.name.trim(),
		phone: form.phone.trim() || null,
		email: form.email.trim() || null,
	}

	try {
		const customer = isEditMode.value
			? await customers.updateCustomer(route.params.id, payload)
			: await customers.createCustomer(payload)

		router.push({ name: 'customers.show', params: { id: customer.id } })
	} catch (err) {
		if (err.response?.status === 422) {
			applyServerErrors(err.response.data.errors ?? {})
		} else {
			console.error(err)
			generalError.value = err.response?.data?.message || 'No se pudo guardar el cliente. Intenta de nuevo.'
		}
	} finally {
		submitting.value = false
	}
}

function handleCancel() {
	if (isEditMode.value) router.push({ name: 'customers.show', params: { id: route.params.id } })
	else router.push({ name: 'customers' })
}
</script>

<style scoped>

</style>
