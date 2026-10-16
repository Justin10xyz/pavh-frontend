<template>
    <div class="p-2 max-w-4xl">
        <div class="mb-4">
            <h1 class="font-serif text-xl text-primary">{{ route.meta.title }}</h1>
            <p class="text-sm text-text-muted mt-0.5">
                {{ isEditMode ? 'Actualiza los datos de contacto del cliente.' : 'Captura los datos de contacto del cliente.' }}
            </p>
        </div>

        <div v-if="loadingCustomer" class="text-text-muted text-sm">Cargando cliente…</div>

        <p v-if="loadError" class="text-danger text-sm mb-4 flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {{ loadError }}
        </p>

        <form v-if="!loadingCustomer && !loadError" @submit.prevent="handleSubmit" class="space-y-4">
            <div class="bg-surface border border-border rounded-md p-5 sm:p-6">
                <h2 class="text-xs font-medium uppercase tracking-wide text-text-muted mb-4">Datos del cliente</h2>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="space-y-1.5 sm:col-span-2">
                        <FieldLabel html-for="name" text="Nombre" required />
                        <InputTextCustom
                            id="name"
                            v-model="form.name"
                            :error="errors.name"
                            autocomplete="off"
                            placeholder="Ej. Constructora del Norte"
                            @input="errors.name = ''"
                        />
                        <p v-if="errors.name" class="text-danger text-xs mt-1.5">{{ errors.name }}</p>
                    </div>

                    <div class="space-y-1.5">
                        <FieldLabel html-for="phone" text="Teléfono" />
                        <div class="relative">
                            <i class="ti ti-phone absolute left-3 top-1/2 -translate-y-1/2 text-base text-text-muted pointer-events-none" aria-hidden="true"></i>
                            <InputTextCustom
                                id="phone"
                                v-model="form.phone"
                                :error="errors.phone"
                                type="tel"
                                autocomplete="off"
                                placeholder="Ej. 81 1234 5678"
                                class="pl-9"
                                @input="errors.phone = ''"
                            />
                        </div>
                        <p v-if="errors.phone" class="text-danger text-xs mt-1.5">{{ errors.phone }}</p>
                    </div>

                    <div class="space-y-1.5">
                        <FieldLabel html-for="email" text="Correo" />
                        <div class="relative">
                            <i class="ti ti-mail absolute left-3 top-1/2 -translate-y-1/2 text-base text-text-muted pointer-events-none" aria-hidden="true"></i>
                            <InputTextCustom
                                id="email"
                                v-model="form.email"
                                :error="errors.email"
                                type="email"
                                autocomplete="off"
                                placeholder="Ej. compras@constructora.mx"
                                class="pl-9"
                                @input="errors.email = ''"
                            />
                        </div>
                        <p v-if="errors.email" class="text-danger text-xs mt-1.5">{{ errors.email }}</p>
                    </div>
                </div>
            </div>

            <!-- Junto a las acciones (no arriba del form), mismo criterio que en
			     Cotizaciones y Ventas. -->
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
                    class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer disabled:cursor-not-allowed"
                >
                    {{ submitting ? 'Guardando…' : (isEditMode ? 'Guardar cambios' : 'Guardar cliente') }}
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
import { useCustomersStore } from '@/stores/customers'
import { useNotify } from '@/composables/useNotify'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'
import FieldLabel from '@/components/widgets/labels/FieldLabel.vue'

const route = useRoute()
const router = useRouter()
const customers = useCustomersStore()
const notify = useNotify()
const confirm = useConfirm()

const isEditMode = computed(() => !!route.params.id)
// Arranca en true en modo edición para no mostrar el form vacío un instante
// antes de que empiece la precarga.
const loadingCustomer = ref(isEditMode.value)

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
// Fallo de fetchCustomer en modo edición: oculta el form (no se debe poder
// enviar uno vacío sobre un cliente que no cargó). generalError queda solo
// para errores de submit, que no desmontan el form.
const loadError = ref(null)

// Cambios sin guardar: se compara contra una foto del form tomada al iniciar
// (creación) o al terminar de cargar el cliente (edición). Se comparan los
// valores ya recortados, igual que el payload que se envía.
function serializeForm() {
    return JSON.stringify([form.name.trim(), form.phone.trim(), form.email.trim()])
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
            message: 'Hay cambios sin guardar en este cliente. Si sales ahora, se perderán.',
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

onMounted(() => {
    if (isEditMode.value) loadCustomer()
})

async function loadCustomer() {
    loadingCustomer.value = true
    await customers.fetchCustomer(route.params.id)
    loadingCustomer.value = false

    const customer = customers.currentCustomer
    if (customers.currentCustomerError || !customer || String(customer.id) !== String(route.params.id)) {
        loadError.value = customers.currentCustomerError || 'No se pudo cargar el cliente.'
        return
    }

    form.name = customer.name
    form.phone = customer.phone ?? ''
    form.email = customer.email ?? ''
    savedSnapshot.value = serializeForm()
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

        // El nombre va en el detalle: a diferencia de un folio puede ser largo.
        notify.success(isEditMode.value ? 'Cliente actualizado' : 'Cliente guardado', customer.name)
        skipLeaveGuard = true
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
