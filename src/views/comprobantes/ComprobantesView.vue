<template>
    <div class="p-2">
        <!-- Sin "Nuevo comprobante": se generan desde el detalle de una
		     cotización pagada (Convertir a comprobante). -->
        <div class="mb-4">
            <h1 class="font-serif text-xl text-primary">Comprobantes</h1>
            <p class="text-sm text-text-muted mt-0.5">
                Comprobantes fiscales simplificados generados desde presupuestos pagados.
            </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 mb-4">
            <div class="relative flex-1 min-w-56">
                <svg
                    class="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2"
                >
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <InputTextCustom
                    v-model="searchQuery"
                    placeholder="Buscar por folio o cliente…"
                    class="max-w-md pl-8"
                />
            </div>
        </div>

        <div v-if="comprobantes.loading && comprobantes.comprobantes.length === 0" class="text-text-muted text-sm">
            Cargando comprobantes…
        </div>
        <div v-else-if="comprobantes.error" class="text-danger text-sm">{{ comprobantes.error }}</div>

        <div v-else-if="filteredComprobantes.length === 0" class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface">
            {{
                searchQuery
                    ? 'No se encontraron comprobantes con esa búsqueda.'
                    : 'Aún no hay comprobantes generados.'
            }}
        </div>

        <template v-else>
            <p class="text-sm text-text-muted mb-2 sm:text-right" aria-live="polite">
                {{ filteredComprobantes.length }} {{ filteredComprobantes.length === 1 ? 'comprobante' : 'comprobantes' }}
                <span aria-hidden="true">·</span>
                Total <span class="font-semibold text-primary tabular-nums">{{ formatCurrency(filteredTotal) }}</span>
            </p>

            <!-- Al recargar con datos ya visibles, la tabla se atenúa en vez de
			     volver a "Cargando…" (mismo criterio que CustomersView). -->
            <div
                class="bg-surface border border-border rounded-md overflow-x-auto transition-opacity"
                :class="{ 'opacity-60': comprobantes.loading }"
                :aria-busy="comprobantes.loading"
            >
                <DataTable
                    :value="filteredComprobantes"
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

                    <Column header="Cliente">
                        <template #body="{ data }">
                            <span :class="data.customer ? 'text-text' : 'text-text-muted'">
                                {{ data.customer?.name ?? 'Sin cliente' }}
                            </span>
                        </template>
                    </Column>

                    <!-- La fecha del comprobante (editable), no la de creación -->
                    <Column
                        header="Fecha"
                        header-class="hidden sm:table-cell"
                        body-class="hidden sm:table-cell whitespace-nowrap"
                    >
                        <template #body="{ data }">
                            <span class="text-text-muted">{{ formatDateOnly(data.date) }}</span>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useComprobantesStore } from '@/stores/comprobantes'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDateOnly } from '@/lib/dates'

const route = useRoute()
const router = useRouter()
const comprobantes = useComprobantesStore()

// Siempre se consulta al entrar: los comprobantes se generan desde otra
// pantalla y createComprobante() no toca el listado.
onMounted(() => {
    comprobantes.listQuery = { ...route.query }
    comprobantes.fetchComprobantes()
})

// Toda la fila abre el detalle. Los clicks sobre un link propio (folio, ojo)
// se dejan al RouterLink, que ya soporta Ctrl/Cmd+click y click medio.
function openComprobante({ originalEvent, data }) {
    if (originalEvent.target.closest('a, button')) return

    const to = { name: 'comprobantes.show', params: { id: data.id } }
    if (originalEvent.ctrlKey || originalEvent.metaKey) {
        window.open(router.resolve(to).href, '_blank')
    } else {
        router.push(to)
    }
}

const searchQuery = ref('')

function normalize(str) {
    return (str ?? '')
        .toString()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
}

const filteredComprobantes = computed(() => {
    const q = normalize(searchQuery.value)
    if (!q) return comprobantes.comprobantes

    return comprobantes.comprobantes.filter(
        (comprobante) => normalize(comprobante.folio).includes(q) || normalize(comprobante.customer?.name).includes(q)
    )
})

// `total` llega como string decimal desde Laravel
const filteredTotal = computed(() =>
    filteredComprobantes.value.reduce((sum, comprobante) => sum + (Number(comprobante.total) || 0), 0)
)
</script>

<style scoped></style>
