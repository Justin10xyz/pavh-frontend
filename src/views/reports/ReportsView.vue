<template>
    <div class="p-2">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h1 class="font-serif text-xl text-primary">Reporte de comprobantes</h1>
        </div>

        <div class="inline-flex gap-2 mb-3" role="group" aria-label="Tipo de periodo">
            <button
                v-for="option in MODE_OPTIONS"
                :key="option.value"
                type="button"
                :aria-pressed="mode === option.value"
                @click="mode = option.value"
                :class="[
                    'font-medium text-sm h-9 px-4 rounded-md border transition-colors select-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent',
                    mode === option.value
                        ? 'bg-primary border-primary text-white'
                        : 'bg-surface border-border text-text-muted hover:bg-bg hover:text-text',
                ]"
            >
                {{ option.label }}
            </button>
        </div>

        <div v-if="mode === 'month'" class="space-y-1 mb-4 max-w-56">
            <FieldLabel html-for="report-period" text="Periodo" />
            <InputTextCustom id="report-period" v-model="period" type="month" />
        </div>

        <div v-else class="flex flex-wrap gap-3 mb-4">
            <div class="space-y-1 w-44">
                <FieldLabel html-for="report-from" text="Desde" />
                <InputTextCustom id="report-from" v-model="rangeFrom" type="date" />
            </div>
            <div class="space-y-1 w-44">
                <FieldLabel html-for="report-to" text="Hasta" />
                <InputTextCustom id="report-to" v-model="rangeTo" type="date" :min="rangeFrom || undefined" />
            </div>
        </div>

        <!-- Rango incompleto o al revés: no se consulta. summary/items se quedan
		     en el store, solo no se muestran. -->
        <div v-if="rangeMessage" class="text-text-muted text-sm" aria-live="polite">{{ rangeMessage }}</div>
        <div v-else-if="reports.loading" class="text-text-muted text-sm">Cargando reporte…</div>
        <div v-else-if="reports.error" class="text-danger text-sm">{{ reports.error }}</div>

        <template v-else-if="reports.summary">
            <div class="flex flex-wrap items-start justify-between gap-3 mb-2">
                <p class="text-sm text-text-muted self-center" aria-live="polite">
                    {{ reports.summary.count }} {{ reports.summary.count === 1 ? 'comprobante' : 'comprobantes' }}
                    <span aria-hidden="true">·</span>
                    Subtotal <span class="font-medium text-text tabular-nums">{{ formatCurrency(reports.summary.subtotal) }}</span>
                    <span aria-hidden="true">·</span>
                    Total <span class="font-semibold text-primary tabular-nums">{{ formatCurrency(reports.summary.total) }}</span>
                </p>

                <!-- Nunca se deshabilitan por falta de datos: un mes sin
				     comprobantes también se descarga. Solo mientras se genera. -->
                <div class="flex flex-col items-end gap-1.5">
                    <div class="flex flex-wrap items-center justify-end gap-3">
                        <button
                            type="button"
                            :disabled="csvBusy"
                            @click="downloadCsv"
                            class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-surface disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                        >
                            <i class="ti ti-file-spreadsheet text-base" aria-hidden="true"></i>
                            {{ csvBusy ? 'Generando CSV…' : 'Descargar CSV' }}
                        </button>
                        <button
                            type="button"
                            :disabled="pdfBusy"
                            @click="downloadPdf"
                            class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer inline-flex items-center gap-2 disabled:bg-primary/50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-1"
                        >
                            <i class="ti ti-download text-base" aria-hidden="true"></i>
                            {{ pdfBusy ? 'Generando PDF…' : 'Descargar PDF' }}
                        </button>
                    </div>
                    <p v-if="csvError" class="text-danger text-xs">{{ csvError }}</p>
                    <p v-if="pdfError" class="text-danger text-xs">{{ pdfError }}</p>
                </div>
            </div>

            <div
                v-if="reports.summary.count === 0"
                class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface"
            >
                No hay comprobantes generados en este periodo.
            </div>

            <div v-else class="bg-surface border border-border rounded-md overflow-x-auto">
                <DataTable
                    :value="reports.items"
                    dataKey="id"
                    class="data-table"
                    :row-class="() => 'cursor-pointer'"
                    @row-click="openComprobante"
                >
                    <Column header="Folio" body-class="whitespace-nowrap">
                        <template #body="{ data }">
                            <RouterLink
                                :to="{ name: 'comprobantes.show', params: { id: data.id } }"
                                class="font-medium text-text hover:text-accent transition-colors"
                            >
                                {{ data.folio }}
                            </RouterLink>
                            <!-- Sin columna Fecha por debajo de sm: va debajo del folio -->
                            <span class="block sm:hidden text-xs text-text-muted">{{ formatDateOnly(data.date) }}</span>
                        </template>
                    </Column>

                    <Column
                        header="Fecha"
                        header-class="hidden sm:table-cell"
                        body-class="hidden sm:table-cell whitespace-nowrap"
                    >
                        <template #body="{ data }">
                            <span class="text-text-muted">{{ formatDateOnly(data.date) }}</span>
                        </template>
                    </Column>

                    <!-- `customer` ya llega como el nombre (string) o null -->
                    <Column header="Cliente">
                        <template #body="{ data }">
                            <span :class="data.customer ? 'text-text' : 'text-text-muted'">
                                {{ data.customer ?? 'Sin cliente' }}
                            </span>
                        </template>
                    </Column>

                    <Column
                        header="Subtotal"
                        header-class="hidden sm:table-cell text-right!"
                        body-class="hidden sm:table-cell text-right whitespace-nowrap"
                    >
                        <template #body="{ data }">
                            <span class="text-text tabular-nums">{{ formatCurrency(data.subtotal) }}</span>
                        </template>
                    </Column>

                    <Column header="Total" header-class="text-right!" body-class="text-right whitespace-nowrap">
                        <template #body="{ data }">
                            <span class="font-semibold text-primary tabular-nums">{{ formatCurrency(data.total) }}</span>
                        </template>
                    </Column>

                    <Column header="" body-class="w-px">
                        <template #body="{ data }">
                            <RouterLink
                                :to="{ name: 'comprobantes.show', params: { id: data.id } }"
                                class="flex items-center p-1.5 lg:p-1 rounded text-text-muted hover:bg-bg hover:text-accent transition-colors cursor-pointer"
                                aria-label="Ver comprobante"
                                title="Ver comprobante"
                            >
                                <i class="ti ti-eye text-base"></i>
                            </RouterLink>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useReportsStore } from '@/stores/reports'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'
import FieldLabel from '@/components/widgets/labels/FieldLabel.vue'
import { formatCurrency } from '@/lib/formatCurrency'
import { APP_TIMEZONE, formatDateOnly } from '@/lib/dates'

const route = useRoute()
const router = useRouter()
const reports = useReportsStore()

// Mes actual en hora de la tienda, no del navegador: cerca de fin de mes una
// laptop en otra zona caería en el mes siguiente/anterior.
function currentMonth() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: APP_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
    }).formatToParts(new Date())
    const get = (type) => parts.find((part) => part.type === type).value
    return `${get('year')}-${get('month')}`
}

// El periodo vive en la URL (?periodo=2026-10), igual que el filtro de
// SalesView: se conserva al volver y se puede enlazar directo. Un valor
// inválido o vacío cae al mes actual.
const period = computed({
    get: () => (/^\d{4}-(0[1-9]|1[0-2])$/.test(route.query.periodo) ? route.query.periodo : currentMonth()),
    set: (value) => {
        router.replace({ query: { ...route.query, periodo: value || undefined } })
    },
})

// Calendario puro, sin zona: el día 0 del mes siguiente es el último de este.
const range = computed(() => {
    const [year, month] = period.value.split('-').map(Number)
    const lastDay = new Date(year, month, 0).getDate()
    return {
        from: `${period.value}-01`,
        to: `${period.value}-${String(lastDay).padStart(2, '0')}`,
    }
})

const MODE_OPTIONS = [
    { value: 'month', label: 'Mes' },
    { value: 'range', label: 'Rango personalizado' },
]

// Modo rango = ?from= y ?to= presentes en la URL, aunque estén vacíos (así se
// mantiene el modo mientras el usuario captura una fecha). Cambiar de modo
// limpia las claves del otro. Al entrar a rango se precarga el mes que estaba
// seleccionado, para no empezar con el reporte en blanco.
const mode = computed({
    get: () => ('from' in route.query && 'to' in route.query ? 'range' : 'month'),
    set: (value) => {
        const rest = { ...route.query }
        delete rest.periodo
        delete rest.from
        delete rest.to
        router.replace({
            query: value === 'range' ? { ...rest, from: range.value.from, to: range.value.to } : rest,
        })
    },
})

// '' en vez de undefined al borrar una fecha: undefined quitaría la clave de la
// URL y sacaría al usuario del modo rango.
const rangeFrom = computed({
    get: () => route.query.from ?? '',
    set: (value) => router.replace({ query: { ...route.query, from: value ?? '' } }),
})

const rangeTo = computed({
    get: () => route.query.to ?? '',
    set: (value) => router.replace({ query: { ...route.query, to: value ?? '' } }),
})

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// "YYYY-MM-DD" se compara bien como string.
const rangeMessage = computed(() => {
    if (mode.value !== 'range') return null
    if (!DATE_PATTERN.test(rangeFrom.value) || !DATE_PATTERN.test(rangeTo.value)) {
        return 'Selecciona ambas fechas para generar el reporte.'
    }
    if (rangeTo.value < rangeFrom.value) return 'La fecha "Hasta" no puede ser anterior a "Desde".'
    return null
})

// Rango que se consulta y descarga; null mientras el rango personalizado sea inválido.
const activeRange = computed(() => {
    if (mode.value === 'month') return range.value
    return rangeMessage.value ? null : { from: rangeFrom.value, to: rangeTo.value }
})

// Busy/error propios por botón; antes del watch, que los limpia al cambiar de periodo.
const pdfBusy = ref(false)
const pdfError = ref(null)
const csvBusy = ref(false)
const csvError = ref(null)

// Se filtra por nombre de ruta: al navegar al detalle, `route` ya cambió antes
// de que este componente se desmonte (mismo patrón que SalesView).
watch(
    () => (route.name === 'reports.comprobantes' ? activeRange.value : null),
    (current) => {
        if (current === null) return
        pdfError.value = null
        csvError.value = null
        reports.fetchComprobanteReport(current)
    },
    { immediate: true }
)

// Toda la fila abre el detalle. Los clicks sobre un link propio (folio) se
// dejan al RouterLink, que ya soporta Ctrl/Cmd+click y click medio.
function openComprobante({ originalEvent, data }) {
    if (originalEvent.target.closest('a, button')) return

    const to = { name: 'comprobantes.show', params: { id: data.id } }
    if (originalEvent.ctrlKey || originalEvent.metaKey) {
        window.open(router.resolve(to).href, '_blank')
    } else {
        router.push(to)
    }
}

// Sin useDocumentPdf: ese composable es para un documento con id+folio y
// compartir. Aquí solo se descarga; el nombre coincide con el
// Content-Disposition del backend.
function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}

async function downloadPdf() {
    const { from, to } = activeRange.value
    pdfBusy.value = true
    pdfError.value = null

    try {
        const blob = await reports.fetchComprobanteReportPdf({ from, to })
        saveBlob(blob, `Reporte-Comprobantes-${from}-a-${to}.pdf`)
    } catch (err) {
        pdfError.value = 'No se pudo generar el PDF.'
        console.error(err)
    } finally {
        pdfBusy.value = false
    }
}

async function downloadCsv() {
    const { from, to } = activeRange.value
    csvBusy.value = true
    csvError.value = null

    try {
        const blob = await reports.fetchComprobanteReportCsv({ from, to })
        saveBlob(blob, `Reporte-Comprobantes-${from}-a-${to}.csv`)
    } catch (err) {
        csvError.value = 'No se pudo generar el CSV.'
        console.error(err)
    } finally {
        csvBusy.value = false
    }
}
</script>

<style scoped></style>
