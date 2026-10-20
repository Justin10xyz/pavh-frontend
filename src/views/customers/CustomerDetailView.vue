<template>
    <div class="p-2 max-w-5xl">
        <div v-if="customers.currentCustomerLoading && !customer" class="text-text-muted text-sm">Cargando cliente…</div>

        <div v-else-if="customers.currentCustomerError" class="space-y-4">
            <p class="text-danger text-sm">{{ customers.currentCustomerError }}</p>
            <button
                type="button"
                @click="goBack"
                class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
            >
                Volver
            </button>
        </div>

        <template v-else-if="customer">
            <!-- Header -->
            <div class="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div class="flex items-start gap-3">
                    <!-- Volver en línea con el título, igual que en los detalles de
					     cotización y venta. Por debajo de lg solo la flecha. -->
                    <RouterLink
                        :to="{ name: 'customers' }"
                        aria-label="Volver a clientes"
                        title="Volver a clientes"
                        class="shrink-0 inline-flex items-center justify-center gap-1.5 h-8 w-8 lg:w-auto lg:px-3 bg-surface border border-border hover:bg-bg text-text-muted hover:text-text text-sm font-medium rounded-md transition-colors select-none"
                    >
                        <i class="ti ti-arrow-left text-base" aria-hidden="true"></i>
                        <span class="hidden lg:inline">Volver</span>
                    </RouterLink>
                    <div>
                        <h1 class="font-serif text-xl text-primary">{{ customer.name }}</h1>
                        <p class="text-sm text-text-muted mt-0.5">Cliente desde el {{ formatDate(customer.created_at) }}</p>
                    </div>
                </div>

                <div class="flex flex-wrap items-center justify-end gap-3">
                    <!-- Destructiva: separada del resto para no quedar junto a "Editar" -->
                    <button
                        type="button"
                        :disabled="busyId === customer.id"
                        @click="requestDelete(customer)"
                        class="bg-surface border border-danger/40 hover:bg-danger/10 text-danger font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-surface disabled:cursor-not-allowed"
                    >
                        <i class="ti ti-trash text-base" aria-hidden="true"></i>
                        Eliminar
                    </button>
                    <span class="hidden sm:block w-px h-6 bg-border" aria-hidden="true"></span>
                    <RouterLink
                        :to="{ name: 'customers.edit', params: { id: customer.id } }"
                        class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none inline-flex items-center"
                    >
                        Editar
                    </RouterLink>
                </div>
            </div>

            <p v-if="deleteError" class="text-danger text-sm mb-4 flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
                <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {{ deleteError }}
            </p>

            <div class="space-y-4">
                <!-- Contacto: nombre y fecha de alta ya están en el header -->
                <div class="bg-surface border border-border rounded-md p-5 sm:p-6">
                    <h2 class="text-xs font-medium uppercase tracking-wide text-text-muted mb-4">Contacto</h2>

                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div class="space-y-1">
                            <dt class="text-xs font-medium text-text-muted">Teléfono</dt>
                            <dd v-if="customer.phone">
                                <a
                                    :href="`tel:${customer.phone}`"
                                    class="block w-fit text-text hover:underline"
                                >
                                    {{ customer.phone }}
                                </a>
                            </dd>
                            <dd v-else class="text-text-muted">Sin teléfono</dd>
                        </div>

                        <div class="space-y-1">
                            <dt class="text-xs font-medium text-text-muted">Correo</dt>
                            <dd v-if="customer.email" class="min-w-0">
                                <a
                                    :href="`mailto:${customer.email}`"
                                    class="block w-fit max-w-full break-all text-text hover:underline"
                                >
                                    {{ customer.email }}
                                </a>
                            </dd>
                            <dd v-else class="text-text-muted">Sin correo</dd>
                        </div>

                        <!-- Dirección: solo los campos capturados; si no hay ninguno,
                             un solo "Sin dirección" en vez de tres vacíos. -->
                        <template v-if="hasAddress">
                            <div v-if="customer.address" class="space-y-1 sm:col-span-2">
                                <dt class="text-xs font-medium text-text-muted">Domicilio</dt>
                                <dd class="text-text break-words">{{ customer.address }}</dd>
                            </div>
                            <div v-if="customer.neighborhood" class="space-y-1">
                                <dt class="text-xs font-medium text-text-muted">Colonia</dt>
                                <dd class="text-text break-words">{{ customer.neighborhood }}</dd>
                            </div>
                            <div v-if="customer.city" class="space-y-1">
                                <dt class="text-xs font-medium text-text-muted">Ciudad</dt>
                                <dd class="text-text break-words">{{ customer.city }}</dd>
                            </div>
                        </template>
                        <div v-else class="space-y-1 sm:col-span-2">
                            <dt class="text-xs font-medium text-text-muted">Dirección</dt>
                            <dd class="text-text-muted">Sin dirección</dd>
                        </div>
                    </dl>
                </div>

                <!-- Historial: cotizaciones -->
                <div class="bg-surface border border-border rounded-md overflow-hidden">
                    <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-5 sm:px-6 pt-5 sm:pt-6 mb-4">
                        <h2 class="text-xs font-medium uppercase tracking-wide text-text-muted">Presupuestos</h2>
                        <p v-if="quotes.length > 0" class="text-sm text-text-muted">
                            {{ quotes.length }} {{ quotes.length === 1 ? 'presupuesto' : 'presupuestos' }}
                        </p>
                    </div>

                    <p v-if="quotesLoading && quotes.length === 0" class="text-text-muted text-sm px-5 sm:px-6 pb-5 sm:pb-6">Cargando presupuestos…</p>
                    <p v-else-if="quotesError" class="text-danger text-sm px-5 sm:px-6 pb-5 sm:pb-6">{{ quotesError }}</p>
                    <p v-else-if="quotes.length === 0" class="text-text-muted text-sm px-5 sm:px-6 pb-5 sm:pb-6">Este cliente no tiene presupuestos.</p>

                    <div v-else class="overflow-x-auto border-t border-border">
                        <DataTable
                            :value="quotes"
                            dataKey="id"
                            class="data-table"
                            :row-class="() => 'cursor-pointer'"
                            @row-click="({ originalEvent, data }) => openRow(originalEvent, { name: 'quotes.show', params: { id: data.id } })"
                        >
                            <Column header="Folio" header-class="pl-5 sm:pl-6" body-class="pl-5 sm:pl-6 whitespace-nowrap">
                                <template #body="{ data }">
                                    <RouterLink
                                        :to="{ name: 'quotes.show', params: { id: data.id } }"
                                        class="font-medium text-text hover:text-accent transition-colors"
                                    >
                                        {{ data.folio }}
                                    </RouterLink>
                                    <!-- Sin columna Fecha por debajo de sm: va debajo del folio -->
                                    <span class="block sm:hidden text-xs text-text-muted">{{ formatDateTime(data.created_at) }}</span>
                                </template>
                            </Column>

                            <Column
                                header="Fecha"
                                header-class="hidden sm:table-cell"
                                body-class="hidden sm:table-cell whitespace-nowrap"
                            >
                                <template #body="{ data }">
                                    <span class="text-text-muted">{{ formatDateTime(data.created_at) }}</span>
                                </template>
                            </Column>

                            <Column header="Status">
                                <template #body="{ data }">
                                    <span class="text-xs px-2 py-0.5 rounded" :class="statusClasses(data.status)">
                                        {{ data.status }}
                                    </span>
                                </template>
                            </Column>

                            <Column header="Total" header-class="text-right! pr-5 sm:pr-6" body-class="text-right whitespace-nowrap pr-5 sm:pr-6">
                                <template #body="{ data }">
                                    <span class="text-text tabular-nums">{{ formatCurrency(data.total) }}</span>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>

                <!-- Historial: ventas -->
                <div class="bg-surface border border-border rounded-md overflow-hidden">
                    <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-5 sm:px-6 pt-5 sm:pt-6 mb-4">
                        <h2 class="text-xs font-medium uppercase tracking-wide text-text-muted">Ventas</h2>
                        <!-- Lo que el cliente ha comprado en total -->
                        <p v-if="sales.length > 0" class="text-sm text-text-muted">
                            {{ sales.length }} {{ sales.length === 1 ? 'venta' : 'ventas' }}
                            <span aria-hidden="true">·</span>
                            Total <span class="font-semibold text-primary tabular-nums">{{ formatCurrency(salesTotal) }}</span>
                        </p>
                    </div>

                    <p v-if="salesLoading && sales.length === 0" class="text-text-muted text-sm px-5 sm:px-6 pb-5 sm:pb-6">Cargando ventas…</p>
                    <p v-else-if="salesError" class="text-danger text-sm px-5 sm:px-6 pb-5 sm:pb-6">{{ salesError }}</p>
                    <p v-else-if="sales.length === 0" class="text-text-muted text-sm px-5 sm:px-6 pb-5 sm:pb-6">Este cliente no tiene ventas.</p>

                    <div v-else class="overflow-x-auto border-t border-border">
                        <DataTable
                            :value="sales"
                            dataKey="id"
                            class="data-table"
                            :row-class="() => 'cursor-pointer'"
                            @row-click="({ originalEvent, data }) => openRow(originalEvent, { name: 'pos.sales.show', params: { id: data.id } })"
                        >
                            <Column header="Folio" header-class="pl-5 sm:pl-6" body-class="pl-5 sm:pl-6 whitespace-nowrap">
                                <template #body="{ data }">
                                    <RouterLink
                                        :to="{ name: 'pos.sales.show', params: { id: data.id } }"
                                        class="font-medium text-text hover:text-accent transition-colors"
                                    >
                                        {{ data.folio }}
                                    </RouterLink>
                                    <span class="block sm:hidden text-xs text-text-muted">{{ formatDateTime(data.created_at) }}</span>
                                </template>
                            </Column>

                            <Column
                                header="Fecha"
                                header-class="hidden sm:table-cell"
                                body-class="hidden sm:table-cell whitespace-nowrap"
                            >
                                <template #body="{ data }">
                                    <span class="text-text-muted">{{ formatDateTime(data.created_at) }}</span>
                                </template>
                            </Column>

                            <Column header="Total" header-class="text-right! pr-5 sm:pr-6" body-class="text-right whitespace-nowrap pr-5 sm:pr-6">
                                <template #body="{ data }">
                                    <span class="text-text tabular-nums">{{ formatCurrency(data.total) }}</span>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
            </div>
        </template>

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
                            Cancelar
                        </button>
                        <button
                            type="button"
                            @click="acceptCallback"
                            class="bg-danger hover:bg-danger/90 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </template>
        </ConfirmDialog>
    </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import axios from '@/lib/axios'
import { useCustomersStore } from '@/stores/customers'
import { useCustomerDelete } from '@/composables/useCustomerDelete'
import { statusClasses } from '@/lib/quoteStatus'
import { formatCurrency } from '@/lib/formatCurrency'
import { formatDate, formatDateTime } from '@/lib/dates'

const route = useRoute()
const router = useRouter()
const customers = useCustomersStore()

// Evita mostrar por un instante un cliente distinto si el store aún trae el
// de una visita anterior.
const customer = computed(() => {
    const current = customers.currentCustomer
    return current && String(current.id) === String(route.params.id) ? current : null
})

const hasAddress = computed(() =>
    !!(customer.value?.address || customer.value?.neighborhood || customer.value?.city)
)

// customers.deleteCustomer() solo quita la fila del listado: limpiar el
// detalle del cliente borrado le toca a esta vista.
const { busyId, deleteError, requestDelete } = useCustomerDelete({
    onDeleted: () => {
        customers.currentCustomer = null
        router.push({ name: 'customers' })
    },
})

// `with=customer` aunque no se muestre: QuoteResource/SaleResource leen
// `customer` siempre y sin eager load sería una consulta por fila.
// Historial pedido directo por axios (mismo criterio que dashboard.js): pasar
// por quotes.fetchQuotes()/sales.fetchSales() escribiría en los listados de
// esas vistas y heredaría su gate de caché/contador. Cada sección tiene su
// propio loading/error para que el fallo de una no oculte la otra.
const quotes = ref([])
const quotesLoading = ref(false)
const quotesError = ref(null)

const sales = ref([])
const salesLoading = ref(false)
const salesError = ref(null)

// Si se navega a otro cliente antes de que responda la consulta anterior,
// solo la respuesta más reciente puede escribir en el historial.
let lastRequestId = 0

async function loadSection(requestId, { items, loading, error, message, load }) {
    loading.value = true
    error.value = null

    try {
        const result = await load()
        if (requestId !== lastRequestId) return
        items.value = result
    } catch (err) {
        if (requestId !== lastRequestId) return
        error.value = message
        console.error(err)
    } finally {
        if (requestId === lastRequestId) loading.value = false
    }
}

function fetchHistory(customerId) {
    const requestId = ++lastRequestId
    quotes.value = []
    sales.value = []

    loadSection(requestId, {
        items: quotes,
        loading: quotesLoading,
        error: quotesError,
        message: 'No se pudieron cargar los presupuestos del cliente.',
        // GET /api/quotes y GET /api/sales ya vienen ordenados por created_at
        // descendente (latest()).
        load: async () => {
            const { data } = await axios.get('/api/quotes', {
                params: { customer_id: customerId, with: 'customer,quoteStatus' },
            })
            return data.data
        },
    })

    loadSection(requestId, {
        items: sales,
        loading: salesLoading,
        error: salesError,
        message: 'No se pudieron cargar las ventas del cliente.',
        load: async () => {
            const { data } = await axios.get('/api/sales', {
                params: { customer_id: customerId, with: 'customer' },
            })
            return data.data
        },
    })
}

const salesTotal = computed(() =>
    sales.value.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)
)

// Toda la fila abre el documento. Los clicks sobre el folio (RouterLink) se
// dejan a él, que ya soporta Ctrl/Cmd+click y click medio.
function openRow(originalEvent, to) {
    if (originalEvent.target.closest('a, button')) return

    if (originalEvent.ctrlKey || originalEvent.metaKey) {
        window.open(router.resolve(to).href, '_blank')
    } else {
        router.push(to)
    }
}

watch(
    () => route.params.id,
    (id) => {
        if (!id) return
        customers.fetchCustomer(id)
        fetchHistory(id)
    },
    { immediate: true }
)


function goBack() {
    router.push({ name: 'customers' })
}
</script>

<style scoped>

</style>
