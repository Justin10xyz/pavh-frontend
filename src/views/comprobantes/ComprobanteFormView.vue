<template>
    <div class="p-2 max-w-4xl">
        <div class="mb-4">
            <h1 class="font-serif text-xl text-primary">Convertir a comprobante</h1>
            <p v-if="quoteId" class="text-sm text-text-muted mt-0.5">
                Revisa los datos copiados del
                <router-link :to="{ name: 'quotes.show', params: { id: quoteId } }" class="text-accent hover:underline">presupuesto de origen</router-link>
                y elige la fecha del comprobante.
            </p>
        </div>

        <div v-if="loadingConversion" class="text-text-muted text-sm">Cargando presupuesto…</div>

        <!-- Error bloqueante de /to-comprobante (cotización sin pagar o que ya
		     tiene comprobante): se oculta el form, no hay nada que se pueda generar. -->
        <div v-else-if="conversionError" class="space-y-3">
            <p class="text-danger text-sm flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
                <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {{ conversionError }}
            </p>
            <router-link
                :to="quoteId ? { name: 'quotes.show', params: { id: quoteId } } : { name: 'quotes' }"
                class="inline-flex items-center bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none"
            >
                {{ quoteId ? 'Volver al presupuesto' : 'Ir a presupuestos' }}
            </router-link>
        </div>

        <form v-else-if="conversion" @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Sección 1 — Datos generales: el cliente viene de la cotización
			     (solo lectura); la fecha es lo único que se elige aquí. -->
            <div class="bg-surface border border-border rounded-md p-5 sm:p-6">
                <h2 class="text-xs font-medium uppercase tracking-wide text-text-muted mb-4">Datos generales</h2>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <dl class="space-y-1 text-sm">
                        <dt class="text-xs font-medium text-text-muted">Cliente</dt>
                        <dd v-if="conversion.customer" class="text-text">
                            <div class="font-medium">{{ conversion.customer.name }}</div>
                            <div v-if="customerAddress" class="text-text-muted">{{ customerAddress }}</div>
                        </dd>
                        <dd v-else class="text-text-muted">Sin cliente</dd>
                    </dl>

                    <div class="space-y-1.5">
                        <FieldLabel html-for="date" text="Fecha del comprobante" />
                        <InputTextCustom
                            id="date"
                            v-model="form.date"
                            type="date"
                            :error="errors.date"
                            @input="errors.date = ''"
                        />
                        <p v-if="errors.date" class="text-danger text-xs mt-1.5">{{ errors.date }}</p>
                        <p v-else class="text-xs text-text-muted">Vacía, se usa la fecha de hoy. Se puede cambiar después.</p>
                    </div>
                </div>
            </div>

            <!-- Sección 2 — Productos: copia tal cual de la cotización, sin edición.
			     Misma tabla que el detalle de cotización y de comprobante. -->
            <div class="bg-surface border border-border rounded-md overflow-hidden">
                <h2 class="text-xs font-medium uppercase tracking-wide text-text-muted px-5 sm:px-6 pt-5 sm:pt-6 mb-4">
                    Productos
                </h2>

                <DocumentItemsTable :items="conversion.items" line-total-label="Importe" />

                <!-- Totales: el comprobante solo guarda subtotal, total y total con
				     letra (sin desglose de descuento/envío/anticipo). -->
                <div class="border-t border-border px-5 sm:px-6 py-4 flex justify-end">
                    <div class="w-full max-w-sm space-y-1.5">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-text-muted">Subtotal</span>
                            <span class="text-text tabular-nums">{{ formatCurrency(conversion.subtotal) }}</span>
                        </div>
                        <div class="flex items-center justify-between text-sm font-medium">
                            <span class="text-text">Total</span>
                            <span class="text-text tabular-nums">{{ formatCurrency(conversion.total) }}</span>
                        </div>
                        <p class="text-xs text-text-muted text-right uppercase">{{ conversion.total_in_words }}</p>
                    </div>
                </div>
            </div>

            <!-- Junto a las acciones (no arriba del form), mismo criterio que en
			     los demás formularios. -->
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
                    {{ submitting ? 'Generando…' : 'Generar comprobante' }}
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
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import axios from '@/lib/axios'
import { useComprobantesStore } from '@/stores/comprobantes'
import { useQuotesStore } from '@/stores/quotes'
import { useNotify } from '@/composables/useNotify'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'
import FieldLabel from '@/components/widgets/labels/FieldLabel.vue'
import DocumentItemsTable from '@/components/widgets/tables/DocumentItemsTable.vue'
import { formatCurrency } from '@/lib/formatCurrency'

const route = useRoute()
const router = useRouter()
const comprobantes = useComprobantesStore()
const quotes = useQuotesStore()
const notify = useNotify()
const confirm = useConfirm()

// Solo existe el modo conversión: sin ?quote_id= no hay nada que generar.
const quoteId = computed(() => route.query.quote_id ?? null)
const loadingConversion = ref(false)
const conversionError = ref(null)
// Respuesta de GET /quotes/{id}/to-comprobante (solo lectura).
const conversion = ref(null)

const form = reactive({
    // String "YYYY-MM-DD" del input date; "" = el backend usa hoy.
    date: '',
})

const errors = reactive({
    date: '',
})

const submitting = ref(false)
const generalError = ref(null)

// A diferencia de /convert (venta), /to-comprobante ya trae cada línea con su
// variante/producto simple (incluso dados de baja), así que no se resuelve
// contra el caché de inventario ni hace falta refetch de respaldo.
async function loadConversion() {
    loadingConversion.value = true

    try {
        const { data } = await axios.get(`/api/quotes/${quoteId.value}/to-comprobante`)
        conversion.value = data.data
        form.date = data.data.date ?? ''
        // La fecha prellenada no cuenta como cambio; solo si se ajusta.
        savedSnapshot.value = serializeForm()
    } catch (err) {
        console.error(err)
        // 422 de Quote::comprobanteConversionBlockedMessage() (sin pagar o ya
        // con comprobante): el mensaje ya viene listo y se muestra tal cual.
        conversionError.value = err.response?.status === 404
            ? 'El presupuesto no existe.'
            : err.response?.data?.message || 'No se pudo cargar el presupuesto.'
    } finally {
        loadingConversion.value = false
    }
}

const customerAddress = computed(() => {
    const customer = conversion.value?.customer
    if (!customer) return ''
    const cp = customer.postal_code ? `C.P. ${customer.postal_code}` : null
    return [customer.address, customer.neighborhood, customer.city, cp].filter(Boolean).join(', ')
})

// Cambios sin guardar: solo la fecha es editable.
function serializeForm() {
    return JSON.stringify({ date: form.date || null })
}

const savedSnapshot = ref(serializeForm())
const isDirty = computed(() => serializeForm() !== savedSnapshot.value)
// Tras generar se navega fuera del form sin pasar por la confirmación.
let skipLeaveGuard = false

function confirmDiscard() {
    if (skipLeaveGuard || !isDirty.value) return true

    return new Promise((resolve) => {
        confirm.require({
            header: 'Descartar cambios',
            message: 'Cambiaste la fecha del comprobante y todavía no lo generas. Si sales ahora, se perderá.',
            accept: () => resolve(true),
            reject: () => resolve(false),
            onHide: () => resolve(false),
        })
    })
}

onBeforeRouteLeave(confirmDiscard)
// Mismo componente con otro ?quote_id=: no es un leave, pero el watch recarga.
onBeforeRouteUpdate(confirmDiscard)

// Cerrar/recargar la pestaña no pasa por el router: el navegador muestra su
// propio aviso genérico (no se puede personalizar el texto).
function handleBeforeUnload(event) {
    if (!isDirty.value) return
    event.preventDefault()
    event.returnValue = ''
}

window.addEventListener('beforeunload', handleBeforeUnload)
onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload))

async function handleSubmit() {
    generalError.value = null
    errors.date = ''
    submitting.value = true

    try {
        const comprobante = await comprobantes.createComprobante({
            quote_id: Number(quoteId.value),
            date: form.date || null,
        })

        // El detalle de la cotización lo muestra al volver, sin esperar el refetch.
        quotes.markQuoteComprobante(quoteId.value, { id: comprobante.id, folio: comprobante.folio })
        skipLeaveGuard = true
        notify.success(`Comprobante ${comprobante.folio} generado`)
        // Al detalle de la cotización: todavía no existe el detalle de comprobante.
        router.push({ name: 'quotes.show', params: { id: quoteId.value } })
    } catch (err) {
        console.error(err)
        const serverErrors = err.response?.status === 422 ? err.response.data.errors ?? {} : {}
        if (serverErrors.date) {
            errors.date = serverErrors.date[0]
            document.getElementById('date')?.focus()
            return
        }
        // 422 de negocio (ej. otra persona ya la convirtió) o error de red.
        generalError.value = err.response?.data?.message || 'No se pudo generar el comprobante. Intenta de nuevo.'
    } finally {
        submitting.value = false
    }
}

function handleCancel() {
    router.push({ name: 'quotes.show', params: { id: quoteId.value } })
}

// Al final del script: con `immediate` corre en setup y necesita que el form,
// el snapshot, etc. ya estén declarados.
watch(quoteId, () => {
    conversion.value = null
    conversionError.value = null
    generalError.value = null
    errors.date = ''
    form.date = ''
    savedSnapshot.value = serializeForm()

    if (quoteId.value) loadConversion()
    else conversionError.value = 'Falta el presupuesto de origen. Genera el comprobante desde el detalle de un presupuesto pagado.'
}, { immediate: true })
</script>

<style scoped></style>
