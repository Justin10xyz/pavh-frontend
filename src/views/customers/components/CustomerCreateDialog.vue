<template>
	<Dialog v-model:visible="visible" modal :pt="{ mask: { class: 'bg-primary/50' } }" @show="focusName" @hide="reset">
		<template #container="{ closeCallback }">
			<form
				class="bg-surface border border-border rounded-md p-4 sm:p-5 w-110 max-w-[90vw]"
				@submit.prevent="handleSubmit"
			>
				<div class="flex items-center justify-between mb-4">
					<h3 class="font-serif text-base text-primary">Nuevo cliente</h3>
					<button
						type="button"
						@click="closeCallback"
						class="text-text-muted hover:text-text transition-colors cursor-pointer"
						aria-label="Cerrar"
					>
						<i class="ti ti-x text-base"></i>
					</button>
				</div>

				<p v-if="generalError" class="text-danger text-xs mb-4">{{ generalError }}</p>

				<div class="space-y-4 mb-5">
					<div class="space-y-1.5">
						<FieldLabel html-for="new_customer_name" text="Nombre" required />
						<InputTextCustom
							id="new_customer_name"
							v-model="form.name"
							:error="errors.name"
							autocomplete="off"
							placeholder="Ej. Constructora del Norte"
							@input="errors.name = ''"
						/>
						<p v-if="errors.name" class="text-danger text-xs mt-1.5">{{ errors.name }}</p>
					</div>

					<div class="space-y-1.5">
						<FieldLabel html-for="new_customer_phone" text="Teléfono" />
						<InputTextCustom
							id="new_customer_phone"
							v-model="form.phone"
							:error="errors.phone"
							type="tel"
							autocomplete="off"
							placeholder="Ej. 81 1234 5678"
							@input="errors.phone = ''"
						/>
						<p v-if="errors.phone" class="text-danger text-xs mt-1.5">{{ errors.phone }}</p>
					</div>

					<div class="space-y-1.5">
						<FieldLabel html-for="new_customer_email" text="Correo" />
						<InputTextCustom
							id="new_customer_email"
							v-model="form.email"
							:error="errors.email"
							type="email"
							autocomplete="off"
							placeholder="Ej. compras@constructora.mx"
							@input="errors.email = ''"
						/>
						<p v-if="errors.email" class="text-danger text-xs mt-1.5">{{ errors.email }}</p>
					</div>
				</div>

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
						{{ submitting ? 'Guardando…' : 'Guardar cliente' }}
					</button>
				</div>
			</form>
		</template>
	</Dialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import Dialog from 'primevue/dialog'
import { useCustomersStore } from '@/stores/customers'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'
import FieldLabel from '@/components/widgets/labels/FieldLabel.vue'

// Alta rápida de cliente sin salir de un form a medio capturar (cotización,
// venta). Mismas reglas que CustomerFormView: solo el nombre se valida aquí, el
// resto llega como 422 del StoreCustomerRequest. Emite el cliente creado para
// que el padre lo seleccione.
const visible = defineModel('visible', { type: Boolean, default: false })
const emit = defineEmits(['created'])

const props = defineProps({
	// Prellenado del nombre al abrir (ej. lo que se escribió en el buscador sin resultados).
	initialName: { type: String, default: '' },
})

const customers = useCustomersStore()

const form = reactive({ name: '', phone: '', email: '' })
const errors = reactive({ name: '', phone: '', email: '' })
const submitting = ref(false)
const generalError = ref(null)
// El `id` cae directo al <input> de InputTextCustom.
function focusName() {
	if (props.initialName && !form.name) form.name = props.initialName
	document.getElementById('new_customer_name')?.focus()
}

function reset() {
	form.name = ''
	form.phone = ''
	form.email = ''
	errors.name = ''
	errors.phone = ''
	errors.email = ''
	generalError.value = null
}

async function handleSubmit() {
	errors.name = form.name.trim() ? '' : 'Este campo es requerido'
	if (errors.name) return

	generalError.value = null
	submitting.value = true

	try {
		const customer = await customers.createCustomer({
			name: form.name.trim(),
			phone: form.phone.trim() || null,
			email: form.email.trim() || null,
		})

		emit('created', customer)
		visible.value = false
	} catch (err) {
		if (err.response?.status === 422) {
			for (const [field, messages] of Object.entries(err.response.data.errors ?? {})) {
				if (field in errors) errors[field] = messages[0]
			}
		} else {
			console.error(err)
			generalError.value = err.response?.data?.message || 'No se pudo guardar el cliente. Intenta de nuevo.'
		}
	} finally {
		submitting.value = false
	}
}
</script>
