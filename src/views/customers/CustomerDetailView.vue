<template>
	<div class="p-2 max-w-5xl">
		<div v-if="customers.currentCustomerLoading && !customer" class="text-text-muted text-sm">Cargando cliente…</div>

		<div v-else-if="customers.currentCustomerError" class="space-y-4">
			<p class="text-danger text-sm">{{ customers.currentCustomerError }}</p>
			<button
				type="button"
				@click="goBack"
				class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
			>
				Volver
			</button>
		</div>

		<template v-else-if="customer">
			<!-- Header -->
			<div class="flex flex-wrap items-start justify-between gap-3 mb-4">
				<div>
					<h1 class="font-serif text-xl text-primary">{{ customer.name }}</h1>
					<p class="text-sm text-text-muted mt-0.5">Cliente desde el {{ formatDate(customer.created_at) }}</p>
				</div>

				<div class="flex flex-wrap items-center gap-3">
					<button
						type="button"
						@click="goBack"
						class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
					>
						Volver
					</button>
					<RouterLink
						:to="{ name: 'customers.edit', params: { id: customer.id } }"
						class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none inline-flex items-center"
					>
						Editar
					</RouterLink>
				</div>
			</div>

			<div class="space-y-4">
				<!-- Datos generales -->
				<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
					<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">Datos generales</h2>

					<dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
						<div class="space-y-1">
							<dt class="text-xs font-medium text-text-muted">Nombre</dt>
							<dd class="text-text font-medium">{{ customer.name }}</dd>
						</div>

						<div class="space-y-1">
							<dt class="text-xs font-medium text-text-muted">Teléfono</dt>
							<dd :class="customer.phone ? 'text-text' : 'text-text-muted'">{{ customer.phone || 'Sin teléfono' }}</dd>
						</div>

						<div class="space-y-1">
							<dt class="text-xs font-medium text-text-muted">Correo</dt>
							<dd :class="customer.email ? 'text-text' : 'text-text-muted'">{{ customer.email || 'Sin correo' }}</dd>
						</div>

						<div class="space-y-1">
							<dt class="text-xs font-medium text-text-muted">Fecha de alta</dt>
							<dd class="text-text">{{ formatDate(customer.created_at) }}</dd>
						</div>
					</dl>
				</div>

				<!-- Historial: cotizaciones -->
				<div class="bg-surface border border-border rounded-md overflow-hidden">
					<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted px-5 sm:px-6 pt-5 sm:pt-6 mb-4">Cotizaciones</h2>

					<p v-if="quotesLoading && quotes.length === 0" class="text-text-muted text-sm px-5 sm:px-6 pb-5 sm:pb-6">Cargando cotizaciones…</p>
					<p v-else-if="quotesError" class="text-danger text-sm px-5 sm:px-6 pb-5 sm:pb-6">{{ quotesError }}</p>
					<p v-else-if="quotes.length === 0" class="text-text-muted text-sm px-5 sm:px-6 pb-5 sm:pb-6">Este cliente no tiene cotizaciones.</p>

					<div v-else class="overflow-x-auto">
						<table class="history-table">
							<thead>
								<tr>
									<th>Folio</th>
									<th>Fecha</th>
									<th>Status</th>
									<th class="text-right">Total</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="quote in quotes" :key="quote.id">
									<td>
										<RouterLink
											:to="{ name: 'quotes.show', params: { id: quote.id } }"
											class="font-medium text-text hover:text-accent transition-colors"
										>
											{{ quote.folio }}
										</RouterLink>
									</td>
									<td class="text-text-muted">{{ formatDateTime(quote.created_at) }}</td>
									<td>
										<span class="text-[10px] px-2 py-0.5 rounded" :class="statusClasses(quote.status)">
											{{ quote.status }}
										</span>
									</td>
									<td class="text-right text-text">{{ formatCurrency(quote.total) }}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				<!-- Historial: ventas -->
				<div class="bg-surface border border-border rounded-md overflow-hidden">
					<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted px-5 sm:px-6 pt-5 sm:pt-6 mb-4">Ventas</h2>

					<p v-if="salesLoading && sales.length === 0" class="text-text-muted text-sm px-5 sm:px-6 pb-5 sm:pb-6">Cargando ventas…</p>
					<p v-else-if="salesError" class="text-danger text-sm px-5 sm:px-6 pb-5 sm:pb-6">{{ salesError }}</p>
					<p v-else-if="sales.length === 0" class="text-text-muted text-sm px-5 sm:px-6 pb-5 sm:pb-6">Este cliente no tiene ventas.</p>

					<div v-else class="overflow-x-auto">
						<table class="history-table">
							<thead>
								<tr>
									<th>Folio</th>
									<th>Fecha</th>
									<th class="text-right">Total</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="sale in sales" :key="sale.id">
									<td>
										<RouterLink
											:to="{ name: 'pos.sales.show', params: { id: sale.id } }"
											class="font-medium text-text hover:text-accent transition-colors"
										>
											{{ sale.folio }}
										</RouterLink>
									</td>
									<td class="text-text-muted">{{ formatDateTime(sale.created_at) }}</td>
									<td class="text-right text-text">{{ formatCurrency(sale.total) }}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</template>
	</div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/lib/axios'
import { useCustomersStore } from '@/stores/customers'
import { statusClasses } from '@/lib/quoteStatus'
import { formatCurrency } from '@/lib/formatCurrency'

const route = useRoute()
const router = useRouter()
const customers = useCustomersStore()

// Evita mostrar por un instante un cliente distinto si el store aún trae el
// de una visita anterior.
const customer = computed(() => {
	const current = customers.currentCustomer
	return current && String(current.id) === String(route.params.id) ? current : null
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
		message: 'No se pudieron cargar las cotizaciones del cliente.',
		// GET /api/quotes no ordena todavía (pendiente en PROJECT.md): se ordena
		// aquí por created_at descendente, igual que las ventas.
		load: async () => {
			const { data } = await axios.get('/api/quotes', {
				params: { customer_id: customerId, with: 'customer,quoteStatus' },
			})
			return [...data.data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
		},
	})

	loadSection(requestId, {
		items: sales,
		loading: salesLoading,
		error: salesError,
		message: 'No se pudieron cargar las ventas del cliente.',
		// GET /api/sales ya viene ordenado por created_at descendente (latest()).
		load: async () => {
			const { data } = await axios.get('/api/sales', {
				params: { customer_id: customerId, with: 'customer' },
			})
			return data.data
		},
	})
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

function formatDate(value) {
	return new Date(value).toLocaleDateString('es-MX', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	})
}

function formatDateTime(value) {
	return new Date(value).toLocaleString('es-MX', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

function goBack() {
	router.push({ name: 'customers' })
}
</script>

<style scoped>
.history-table {
	width: 100%;
	border-collapse: collapse;
}
.history-table thead th {
	font-size: 11px;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.03em;
	color: var(--color-text-muted);
	background: var(--color-bg);
	padding: 0.5rem 0.75rem;
	border-top: 1px solid var(--color-border);
	border-bottom: 1px solid var(--color-border);
}
.history-table thead th:not(.text-right) {
	text-align: left;
}
.history-table tbody td {
	padding: 0.5rem 0.75rem;
	vertical-align: middle;
	border-bottom: 1px solid var(--color-border);
	font-size: 0.8125rem;
}
.history-table tbody tr:last-child td {
	border-bottom: none;
}
.history-table tbody tr:hover {
	background: var(--color-bg);
}
.history-table th:first-child,
.history-table td:first-child {
	padding-left: 1.5rem;
}
.history-table th:last-child,
.history-table td:last-child {
	padding-right: 1.5rem;
}
</style>
