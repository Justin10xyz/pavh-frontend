<template>
    <div class="p-2 max-w-4xl">
        <div class="flex items-center gap-3 mb-4">
            <!-- Volver en línea con el título, igual que en los demás catálogos.
			     Por debajo de lg solo la flecha. -->
            <RouterLink
                :to="{ name: 'settings.index' }"
                aria-label="Volver a configuración"
                title="Volver a configuración"
                class="shrink-0 inline-flex items-center justify-center gap-1.5 h-8 w-8 lg:w-auto lg:px-3 bg-surface border border-border hover:bg-bg text-text-muted hover:text-text text-sm font-medium rounded-md transition-colors select-none"
            >
                <i class="ti ti-arrow-left text-base" aria-hidden="true"></i>
                <span class="hidden lg:inline">Volver</span>
            </RouterLink>
            <div>
                <h1 class="font-serif text-xl text-primary">{{ route.meta.title }}</h1>
                <p class="text-sm text-text-muted mt-0.5">Datos fiscales y de contacto del negocio.</p>
            </div>
        </div>

        <div v-if="loading" class="text-text-muted text-sm">Cargando datos del negocio…</div>

        <p v-else-if="businessSettings.error" class="text-danger text-sm mb-4 flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {{ businessSettings.error }}
        </p>

        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Una sola card con tres secciones: es un solo registro. -->
            <div class="bg-surface border border-border rounded-md p-5 sm:p-6 divide-y divide-border">
                <section
                    v-for="section in sections"
                    :key="section.title"
                    class="py-5 first:pt-0 last:pb-0"
                >
                    <h2 class="text-xs font-medium uppercase tracking-wide text-text-muted mb-4">{{ section.title }}</h2>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div
                            v-for="field in section.fields"
                            :key="field.key"
                            class="space-y-1.5"
                            :class="{ 'sm:col-span-2': field.wide }"
                        >
                            <FieldLabel :html-for="field.key" :text="field.label" />
                            <!-- Ícono a la izquierda como en CustomerFormView.vue:
							     InputTextCustom no tiene prop de ícono. -->
                            <div :class="{ relative: field.icon }">
                                <i
                                    v-if="field.icon"
                                    :class="['ti', field.icon, 'absolute left-3 top-1/2 -translate-y-1/2 text-base text-text-muted pointer-events-none']"
                                    aria-hidden="true"
                                ></i>
                                <InputTextCustom
                                    :id="field.key"
                                    v-model="form[field.key]"
                                    :error="errors[field.key]"
                                    :type="field.type ?? 'text'"
                                    autocomplete="off"
                                    :placeholder="field.placeholder"
                                    :class="{ 'pl-9': field.icon }"
                                    @input="errors[field.key] = ''"
                                />
                            </div>
                            <p v-if="errors[field.key]" class="text-danger text-xs mt-1.5">{{ errors[field.key] }}</p>
                        </div>
                    </div>
                </section>
            </div>

            <!-- Junto a las acciones (no arriba del form), mismo criterio que en
			     los demás formularios. -->
            <p v-if="generalError" role="alert" class="text-danger text-sm flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
                <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {{ generalError }}
            </p>

            <!-- Acciones. Todos los campos son opcionales: el botón solo se
			     deshabilita mientras guarda. -->
            <div class="flex items-center justify-end gap-3">
                <button
                    type="submit"
                    :disabled="submitting"
                    class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-1"
                >
                    {{ submitting ? 'Guardando…' : 'Guardar' }}
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
                            autofocus
                            @click="rejectCallback"
                            class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                        >
                            Seguir editando
                        </button>
                        <button
                            type="button"
                            @click="acceptCallback"
                            class="bg-danger hover:bg-danger/90 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-1"
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
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useBusinessSettingsStore } from '@/stores/businessSettings'
import { useNotify } from '@/composables/useNotify'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'
import FieldLabel from '@/components/widgets/labels/FieldLabel.vue'

const route = useRoute()
const businessSettings = useBusinessSettingsStore()
const notify = useNotify()
const confirm = useConfirm()

// Todos opcionales (el backend los valida nullable|string|max:255), por eso
// ningún FieldLabel lleva `required` y no hay validación local.
const sections = [
    {
        title: 'Datos fiscales',
        fields: [
            { key: 'place_of_issue', label: 'Lugar de expedición', placeholder: 'Ej. Monterrey, N.L.' },
            { key: 'business_regime', label: 'Régimen de actividad empresarial', placeholder: 'Ej. Régimen Simplificado de Confianza' },
            { key: 'tax_id', label: 'RFC', placeholder: 'Ej. XAXX010101000' },
            { key: 'tax_id_number', label: 'idCIF', placeholder: 'Ej. 12345678901' },
        ],
    },
    {
        title: 'Domicilio',
        fields: [
            { key: 'address', label: 'Domicilio', placeholder: 'Ej. Av. Constitución 1234', icon: 'ti-map-pin', wide: true },
            { key: 'neighborhood', label: 'Colonia', placeholder: 'Ej. Centro' },
            { key: 'city', label: 'Ciudad', placeholder: 'Ej. Monterrey' },
            { key: 'postal_code', label: 'C.P.', placeholder: 'Ej. 64000' },
        ],
    },
    {
        title: 'Contacto',
        fields: [
            { key: 'phone_primary', label: 'Teléfono principal', placeholder: 'Ej. 81 1234 5678', icon: 'ti-phone', type: 'tel' },
            { key: 'phone_secondary', label: 'Teléfono secundario', placeholder: 'Ej. 81 8765 4321', icon: 'ti-phone', type: 'tel' },
            { key: 'email', label: 'Correo', placeholder: 'Ej. contacto@negocio.mx', icon: 'ti-mail', type: 'email', wide: true },
        ],
    },
]

const fieldKeys = sections.flatMap((section) => section.fields.map((field) => field.key))
const emptyFields = () => Object.fromEntries(fieldKeys.map((key) => [key, '']))

const form = reactive(emptyFields())
const errors = reactive(emptyFields())

const submitting = ref(false)
const generalError = ref(null)
// Arranca en true si el store aún no tiene los datos, para no mostrar el form
// vacío un instante antes de que empiece la carga.
const loading = ref(!businessSettings.initialized)

// Cambios sin guardar: se compara contra una foto del form tomada al cargar y
// después de cada guardado. Se comparan los valores ya recortados, igual que
// el payload que se envía.
function serializeForm() {
    return JSON.stringify(fieldKeys.map((key) => form[key].trim()))
}

const savedSnapshot = ref(serializeForm())
const isDirty = computed(() => serializeForm() !== savedSnapshot.value)

onBeforeRouteLeave(() => {
    if (!isDirty.value) return true

    return new Promise((resolve) => {
        confirm.require({
            header: 'Descartar cambios',
            message: 'Hay cambios sin guardar en los datos del negocio. Si sales ahora, se perderán.',
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

onMounted(loadSettings)

async function loadSettings() {
    await businessSettings.fetchBusinessSettings()
    loading.value = false

    if (businessSettings.settings) fillForm(businessSettings.settings)
}

function fillForm(settings) {
    for (const key of fieldKeys) form[key] = settings[key] ?? ''
    savedSnapshot.value = serializeForm()
}

function applyServerErrors(serverErrors) {
    for (const field of Object.keys(serverErrors)) {
        if (field in errors) {
            errors[field] = serverErrors[field][0]
        }
    }
}

async function handleSubmit() {
    generalError.value = null
    submitting.value = true

    const payload = Object.fromEntries(fieldKeys.map((key) => [key, form[key].trim() || null]))

    try {
        const settings = await businessSettings.updateBusinessSettings(payload)
        // Se queda en la pantalla: la foto nueva es lo recién guardado.
        fillForm(settings)
        notify.success('Datos del negocio guardados')
    } catch (err) {
        if (err.response?.status === 422) {
            applyServerErrors(err.response.data.errors ?? {})
        } else {
            console.error(err)
            generalError.value = err.response?.data?.message || 'No se pudieron guardar los datos del negocio. Intenta de nuevo.'
        }
    } finally {
        submitting.value = false
    }
}
</script>

<style scoped>

</style>
