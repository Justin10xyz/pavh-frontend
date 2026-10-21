<template>
    <Dialog v-model:visible="visible" modal :pt="{ mask: { class: 'bg-primary/50' } }" @show="fillForm" @hide="reset">
        <template #container="{ closeCallback }">
            <form @submit.prevent="submitFloorStyle" class="bg-surface border border-border rounded-md p-4 sm:p-5 w-110 max-w-[90vw]">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-serif text-base text-primary">{{ isEditMode ? 'Editar estilo de piso' : 'Nuevo estilo de piso' }}</h3>
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
                    <FieldLabel html-for="floor_style_name" text="Nombre" required />
                    <InputTextCustom
                        id="floor_style_name"
                        v-model="name"
                        :error="errors.name"
                        placeholder="Ej. Madera"
                        @input="errors.name = ''"
                    />
                    <p v-if="errors.name" class="text-danger text-xs mt-1.5">{{ errors.name }}</p>
                </div>

                <!-- Abierto desde un formulario de producto solo se puede crear; editar,
				     eliminar y revisar el resto de los estilos de piso queda en Configuración. Es texto y
				     no enlace para no sacar al usuario del formulario que está llenando. -->
                <p
                    v-if="fromProductForm"
                    class="flex gap-2 text-xs text-text-muted bg-bg border border-border rounded-md p-3 mb-4"
                >
                    <i class="ti ti-info-circle text-sm shrink-0" aria-hidden="true"></i>
                    <span>
                        Para editar o eliminar estilos de piso, o ver todos los que existen, ve a
                        <span class="font-medium text-text">Configuración → Estilos de piso</span>.
                    </span>
                </p>

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
import FieldLabel from '@/components/widgets/labels/FieldLabel.vue'

const visible = defineModel('visible', { type: Boolean, default: false })
const props = defineProps({
    // Con un estilo de piso el formulario edita; sin él, crea uno nuevo.
    floorStyle: { type: Object, default: null },
    // Abierto desde el formulario de producto: muestra dónde se administran los
    // estilos de piso (CategoryFormDialog usa fixedProductFormType para lo mismo).
    fromProductForm: { type: Boolean, default: false },
})

// Se emite con el estilo de piso guardado para que quien abrió el diálogo lo use
// (ej. dejarlo seleccionado en el formulario de producto).
const emit = defineEmits(['saved'])

const catalogs = useCatalogsStore()
const notify = useNotify()

const name = ref('')
const errors = reactive({ name: '' })
const generalError = ref(null)
const submitting = ref(false)

const isEditMode = computed(() => !!props.floorStyle?.id)

function fillForm() {
    name.value = props.floorStyle?.name ?? ''
    // Sin esto el foco cae en el botón de cerrar (el primer enfocable del diálogo).
    document.getElementById('floor_style_name')?.focus()
}

function reset() {
    name.value = ''
    errors.name = ''
    generalError.value = null
}

// Mismo criterio que los forms de Clientes: el botón queda habilitado y lo que
// falta se marca en su campo al intentar guardar, en vez de un botón gris sin
// explicación.
function validateRequired() {
    errors.name = name.value.trim() ? '' : 'Este campo es requerido'
    return !errors.name
}

async function submitFloorStyle() {
    if (submitting.value) return

    generalError.value = null
    if (!validateRequired()) return

    submitting.value = true

    try {
        const payload = { name: name.value.trim() }

        let saved
        if (isEditMode.value) {
            const { data } = await axios.put(`/api/floor-styles/${props.floorStyle.id}`, payload)
            saved = data.data
            catalogs.updateFloorStyle(props.floorStyle.id, saved)
            notify.success('Estilo de piso actualizado', saved.name)
        } else {
            const { data } = await axios.post('/api/floor-styles', payload)
            saved = data.data
            catalogs.addFloorStyle(saved)
            notify.success('Estilo de piso guardado', saved.name)
        }

        emit('saved', saved)
        visible.value = false
    } catch (err) {
        if (err.response?.status === 422) {
            const serverErrors = err.response.data.errors ?? {}
            errors.name = serverErrors.name?.[0] ?? ''
            if (!errors.name) {
                generalError.value = err.response.data.message || 'No se pudo guardar el estilo de piso.'
            }
        } else {
            generalError.value = err.response?.data?.message || 'No se pudo guardar el estilo de piso. Intenta de nuevo.'
        }
    } finally {
        submitting.value = false
    }
}
</script>

<style scoped></style>
