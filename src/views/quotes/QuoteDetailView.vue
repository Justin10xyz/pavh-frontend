<template>
	<div class="p-2 max-w-5xl">
		<div v-if="quotes.currentQuoteLoading && !quote" class="text-text-muted text-sm">Cargando cotización…</div>

		<div v-else-if="quotes.currentQuoteError" class="space-y-4">
			<p class="text-danger text-sm">{{ quotes.currentQuoteError }}</p>
			<button
				type="button"
				@click="goBack"
				class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
			>
				Volver
			</button>
		</div>

		<template v-else-if="quote">
			<!-- Header -->
			<div class="flex flex-wrap items-start justify-between gap-3 mb-4">
				<div>
					<div class="flex items-center gap-2">
						<h1 class="font-serif text-xl text-primary">{{ quote.folio }}</h1>
						<span class="text-[10px] px-2 py-0.5 rounded" :class="statusClasses(quote.status)">
							{{ quote.status }}
						</span>
					</div>
					<p class="text-sm text-text-muted mt-0.5">Creada el {{ formatDate(quote.created_at) }}</p>
				</div>

				<div class="flex items-center gap-3">
					<button
						type="button"
						@click="goBack"
						class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
					>
						Volver
					</button>
					<button
						type="button"
						:disabled="!isEditable"
						:title="isEditable ? 'Editar cotización' : 'Solo se pueden editar cotizaciones en estado Borrador'"
						class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer disabled:opacity-50 disabled:hover:bg-surface disabled:cursor-not-allowed"
					>
						Editar
					</button>
					<button
						type="button"
						disabled
						title="Disponible próximamente"
						class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer disabled:bg-primary/50 disabled:cursor-not-allowed"
					>
						Convertir a venta
					</button>
				</div>
			</div>

			<div class="space-y-4">
				<!-- Datos generales -->
				<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
					<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">Datos generales</h2>

					<dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
						<div class="space-y-1">
							<dt class="text-xs font-medium text-text-muted">Cliente</dt>
							<dd v-if="quote.customer" class="text-text">
								<div class="font-medium">{{ quote.customer.name }}</div>
								<div v-if="quote.customer.phone" class="text-text-muted text-[13px]">{{ quote.customer.phone }}</div>
								<div v-if="quote.customer.email" class="text-text-muted text-[13px]">{{ quote.customer.email }}</div>
							</dd>
							<dd v-else class="text-text-muted">Sin cliente</dd>
						</div>

						<div class="space-y-1">
							<dt class="text-xs font-medium text-text-muted">Fecha de creación</dt>
							<dd class="text-text">{{ formatDate(quote.created_at) }}</dd>
						</div>

						<div v-if="quote.notes" class="space-y-1 sm:col-span-2">
							<dt class="text-xs font-medium text-text-muted">Notas</dt>
							<dd class="text-text whitespace-pre-line">{{ quote.notes }}</dd>
						</div>
					</dl>
				</div>

				<!-- Líneas -->
				<div class="bg-surface border border-border rounded-md overflow-hidden">
					<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted px-5 sm:px-6 pt-5 sm:pt-6 mb-4">Productos</h2>

					<div class="overflow-x-auto">
						<table class="items-table">
							<thead>
								<tr>
									<th>Producto</th>
									<th class="text-right">Cantidad</th>
									<th class="text-right">Cajas</th>
									<th class="text-right">Precio unitario</th>
									<th class="text-right">Subtotal</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="item in quote.items" :key="item.id">
									<td>
										<div class="font-medium text-text">{{ item.product_variant?.product?.name ?? '—' }}</div>
										<div class="text-text-muted text-[12px]">
											{{ item.product_variant?.color }} · {{ item.product_variant?.size }}
										</div>
									</td>
									<td class="text-right text-text">{{ formatQuantity(item.quantity) }} m²</td>
									<td class="text-right text-text-muted">{{ boxesFor(item) ?? '—' }}</td>
									<td class="text-right text-text">{{ formatCurrency(item.unit_price) }}/m²</td>
									<td class="text-right text-text">{{ formatCurrency(item.line_total) }}</td>
								</tr>
							</tbody>
						</table>
					</div>

					<!-- Totales -->
					<div class="border-t border-border px-5 sm:px-6 py-4 flex justify-end">
						<div class="w-full max-w-xs space-y-1.5">
							<div class="flex items-center justify-between text-sm">
								<span class="text-text-muted">Subtotal</span>
								<span class="text-text">{{ formatCurrency(quote.subtotal) }}</span>
							</div>
							<div class="flex items-center justify-between text-sm font-medium">
								<span class="text-text">Total</span>
								<span class="text-text">{{ formatCurrency(quote.total) }}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</template>
	</div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuotesStore } from '@/stores/quotes'
import { statusClasses } from '@/lib/quoteStatus'

const route = useRoute()
const router = useRouter()
const quotes = useQuotesStore()

watch(
	() => route.params.id,
	(id) => {
		if (id) quotes.fetchQuote(id)
	},
	{ immediate: true }
)

// Evita mostrar por un instante una cotización distinta si el store aún
// trae la de una visita anterior.
const quote = computed(() => {
	const current = quotes.currentQuote
	return current && String(current.id) === String(route.params.id) ? current : null
})

const isEditable = computed(() => quote.value?.status === 'Borrador')

// Mismo cálculo que QuoteFormView: quantity está en m², el stock en cajas.
function boxesFor(item) {
	const m2PerBox = item.product_variant?.m2_per_box
	if (!m2PerBox) return null
	return Math.ceil((Number(item.quantity) || 0) / m2PerBox)
}

const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function formatCurrency(value) {
	return currencyFormatter.format(Number(value))
}

function formatQuantity(value) {
	return Number(value).toLocaleString('es-MX', { maximumFractionDigits: 2 })
}

function formatDate(value) {
	return new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function goBack() {
	router.push({ name: 'quotes' })
}
</script>

<style scoped>
.items-table {
	width: 100%;
	border-collapse: collapse;
}
.items-table thead th {
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
.items-table thead th:not(.text-right) {
	text-align: left;
}
.items-table tbody td {
	padding: 0.5rem 0.75rem;
	vertical-align: middle;
	border-bottom: 1px solid var(--color-border);
	font-size: 0.8125rem;
}
.items-table tbody tr:last-child td {
	border-bottom: none;
}
.items-table th:first-child,
.items-table td:first-child {
	padding-left: 1.5rem;
}
.items-table th:last-child,
.items-table td:last-child {
	padding-right: 1.5rem;
}
</style>
