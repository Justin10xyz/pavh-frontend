<template>
	<div class="p-2 max-w-5xl">
		<div v-if="sales.currentSaleLoading && !sale" class="text-text-muted text-sm">Cargando venta…</div>

		<div v-else-if="sales.currentSaleError" class="space-y-4">
			<p class="text-danger text-sm">{{ sales.currentSaleError }}</p>
			<button
				type="button"
				@click="goBack"
				class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
			>
				Volver
			</button>
		</div>

		<template v-else-if="sale">
			<!-- Header -->
			<div class="flex flex-wrap items-start justify-between gap-3 mb-4">
				<div>
					<h1 class="font-serif text-xl text-primary">{{ sale.folio }}</h1>
					<p class="text-sm text-text-muted mt-0.5">Registrada el {{ formatDateTime(sale.created_at) }}</p>
				</div>

				<div class="flex flex-col items-end gap-1.5">
					<div class="flex flex-wrap items-center gap-3">
						<button
							type="button"
							@click="goBack"
							class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
						>
							Volver
						</button>
						<button
							v-if="canShareFiles"
							type="button"
							:disabled="pdfBusy"
							@click="sharePdf"
							class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-surface disabled:cursor-not-allowed"
						>
							<i class="ti ti-share text-[15px]"></i>
							Compartir
						</button>
						<button
							type="button"
							:disabled="pdfBusy"
							@click="downloadPdf"
							class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer inline-flex items-center gap-2 disabled:bg-primary/50 disabled:cursor-not-allowed"
						>
							<i class="ti ti-download text-[15px]"></i>
							{{ pdfBusy ? 'Generando PDF…' : 'Descargar PDF' }}
						</button>
					</div>
					<p v-if="pdfError" class="text-danger text-xs">{{ pdfError }}</p>
				</div>
			</div>

			<div class="space-y-4">
				<!-- Datos generales -->
				<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
					<h2 class="text-[11px] font-medium uppercase tracking-wide text-text-muted mb-4">Datos generales</h2>

					<dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
						<div class="space-y-1">
							<dt class="text-xs font-medium text-text-muted">Cliente</dt>
							<dd v-if="sale.customer" class="text-text">
								<div class="font-medium">{{ sale.customer.name }}</div>
								<div v-if="sale.customer.phone" class="text-text-muted text-[13px]">{{ sale.customer.phone }}</div>
								<div v-if="sale.customer.email" class="text-text-muted text-[13px]">{{ sale.customer.email }}</div>
							</dd>
							<dd v-else class="text-text-muted">Sin cliente</dd>
						</div>

						<div class="space-y-1">
							<dt class="text-xs font-medium text-text-muted">Fecha de venta</dt>
							<dd class="text-text">{{ formatDateTime(sale.created_at) }}</dd>
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
									<th class="text-right">Precio unitario</th>
									<th class="text-right">Subtotal</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="item in sale.items" :key="item.id">
									<td>
										<div class="font-medium text-text">{{ item.product_variant?.product?.name ?? '—' }}</div>
										<div class="text-text-muted text-[12px]">
											{{ item.product_variant?.color }} · {{ item.product_variant?.size }}
										</div>
									</td>
									<td class="text-right text-text">{{ formatQuantity(item.quantity) }} m²</td>
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
								<span class="text-text">{{ formatCurrency(sale.subtotal) }}</span>
							</div>
							<div class="flex items-center justify-between text-sm font-medium">
								<span class="text-text">Total</span>
								<span class="text-text">{{ formatCurrency(sale.total) }}</span>
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
import { useSalesStore } from '@/stores/sales'
import { useDocumentPdf } from '@/composables/useDocumentPdf'

const route = useRoute()
const router = useRouter()
const sales = useSalesStore()

// Evita mostrar por un instante una venta distinta si el store aún trae la
// de una visita anterior.
const sale = computed(() => {
	const current = sales.currentSale
	return current && String(current.id) === String(route.params.id) ? current : null
})

const { canShareFiles, pdfBusy, pdfError, downloadPdf, sharePdf, reset: resetPdf } = useDocumentPdf({
	fetchPdf: sales.fetchSalePdf,
	filePrefix: 'Venta',
	id: () => route.params.id,
	document: sale,
})

watch(
	() => route.params.id,
	(id) => {
		resetPdf()
		if (id) sales.fetchSale(id)
	},
	{ immediate: true }
)

const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function formatCurrency(value) {
	return currencyFormatter.format(Number(value))
}

function formatQuantity(value) {
	return Number(value).toLocaleString('es-MX', { maximumFractionDigits: 2 })
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
	router.push({ name: 'pos.sales.index' })
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
