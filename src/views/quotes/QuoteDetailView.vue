<template>
	<div class="p-2 max-w-5xl">
		<div v-if="quotes.currentQuoteLoading && !quote" class="text-text-muted text-sm">
			Cargando cotización…
		</div>

		<div v-else-if="quotes.currentQuoteError" class="space-y-4">
			<p class="text-danger text-sm">{{ quotes.currentQuoteError }}</p>
			<button
				type="button"
				@click="goBack"
				class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
			>
				Volver
			</button>
		</div>

		<template v-else-if="quote">
			<!-- Header -->
			<div class="flex flex-wrap items-start justify-between gap-3 mb-4">
				<div class="flex items-start gap-3">
					<!-- Volver en línea con el título (antes se perdía entre las acciones).
					     Por debajo de lg solo la flecha. -->
					<RouterLink
						:to="{ name: 'quotes', query: quotes.listQuery }"
						aria-label="Volver a cotizaciones"
						title="Volver a cotizaciones"
						class="shrink-0 inline-flex items-center justify-center gap-1.5 h-8 w-8 lg:w-auto lg:px-3 bg-surface border border-border hover:bg-bg text-text-muted hover:text-text text-sm font-medium rounded-md transition-colors select-none"
					>
						<i class="ti ti-arrow-left text-base" aria-hidden="true"></i>
						<span class="hidden lg:inline">Volver</span>
					</RouterLink>
					<div>
						<div class="flex items-center gap-2">
							<h1 class="font-serif text-xl text-primary">{{ quote.folio }}</h1>
							<span
								class="text-xs px-2 py-0.5 rounded"
								:class="statusClasses(quote.status)"
							>
								{{ quote.status }}
							</span>
						</div>
						<p class="text-sm text-text-muted mt-0.5">
							Creada el {{ formatDate(quote.created_at) }}
						</p>
					</div>
				</div>

				<div class="flex flex-col items-end gap-1.5">
					<div class="flex flex-wrap items-center justify-end gap-3">
						<!-- Editar/Cancelar/Convertir solo existen en Borrador: en un estado
						     terminal se ocultan en vez de quedar deshabilitados (el tooltip
						     que explicaba por qué no se ve en touch ni en un botón disabled). -->
						<template v-if="isEditable">
							<!-- Destructiva: separada del resto para no quedar junto a "Editar" -->
							<button
								type="button"
								:disabled="cancelling"
								@click="requestCancel"
								class="bg-surface border border-danger/40 hover:bg-danger/10 text-danger font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer disabled:opacity-50 disabled:hover:bg-surface disabled:cursor-not-allowed"
							>
								{{ cancelling ? "Cancelando…" : "Cancelar cotización" }}
							</button>
							<span class="hidden sm:block w-px h-6 bg-border" aria-hidden="true"></span>
							<button
								type="button"
								@click="editQuote"
								class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
							>
								Editar
							</button>
						</template>
						<!-- Por debajo de sm solo ícono, para que las acciones no ocupen tres renglones -->
						<button
							v-if="canShareFiles"
							type="button"
							:disabled="pdfBusy"
							@click="sharePdf"
							aria-label="Compartir"
							title="Compartir"
							class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-3 sm:px-4 rounded-md transition-colors select-none cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-surface disabled:cursor-not-allowed"
						>
							<i class="ti ti-share text-base" aria-hidden="true"></i>
							<span class="hidden sm:inline">Compartir</span>
						</button>
						<button
							type="button"
							:disabled="pdfBusy"
							@click="downloadPdf"
							aria-label="Descargar PDF"
							title="Descargar PDF"
							class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-3 sm:px-4 rounded-md transition-colors select-none cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-surface disabled:cursor-not-allowed"
						>
							<i class="ti ti-download text-base" aria-hidden="true"></i>
							<span class="hidden sm:inline">{{
								pdfBusy ? "Generando PDF…" : "Descargar PDF"
							}}</span>
						</button>
						<button
							v-if="isEditable"
							type="button"
							@click="convertToSale"
							class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
						>
							Convertir a venta
						</button>
					</div>
					<p v-if="pdfError" class="text-danger text-xs">{{ pdfError }}</p>
					<p v-if="cancelError" class="text-danger text-xs">{{ cancelError }}</p>
				</div>
			</div>

			<div class="space-y-4">
				<!-- Datos generales -->
				<div class="bg-surface border border-border rounded-md p-5 sm:p-6">
					<h2
						class="text-xs font-medium uppercase tracking-wide text-text-muted mb-4"
					>
						Datos generales
					</h2>

					<dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
						<div class="space-y-1">
							<dt class="text-xs font-medium text-text-muted">Cliente</dt>
							<dd v-if="quote.customer" class="text-text">
								<div class="font-medium">{{ quote.customer.name }}</div>
								<a
									v-if="quote.customer.phone"
									:href="`tel:${quote.customer.phone}`"
									class="block w-fit text-text-muted text-sm hover:text-text hover:underline"
								>
									{{ quote.customer.phone }}
								</a>
								<a
									v-if="quote.customer.email"
									:href="`mailto:${quote.customer.email}`"
									class="block w-fit text-text-muted text-sm hover:text-text hover:underline"
								>
									{{ quote.customer.email }}
								</a>
							</dd>
							<dd v-else class="text-text-muted">Sin cliente</dd>
						</div>

						<div v-if="quote.notes" class="space-y-1 sm:col-span-2">
							<dt class="text-xs font-medium text-text-muted">Notas</dt>
							<dd class="text-text whitespace-pre-line">{{ quote.notes }}</dd>
						</div>
					</dl>
				</div>

				<!-- Líneas -->
				<div class="bg-surface border border-border rounded-md overflow-hidden">
					<h2
						class="text-xs font-medium uppercase tracking-wide text-text-muted px-5 sm:px-6 pt-5 sm:pt-6 mb-4"
					>
						Productos
					</h2>

					<div class="overflow-x-auto">
						<table class="items-table">
							<thead>
								<tr>
									<th>Producto</th>
									<th class="text-right">Cantidad</th>
									<!-- Cajas y precio unitario se ocultan por debajo de sm: el subtotal ya basta -->
									<th class="text-right hidden sm:table-cell">Cajas</th>
									<th class="text-right hidden sm:table-cell">Precio unitario</th>
									<th class="text-right">Subtotal</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="item in quote.items" :key="item.id">
									<!-- Línea de producto simple: sin color/medida ni cajas, cantidad en unidades -->
									<template v-if="item.simple_product_id">
										<td>
											<div class="font-medium text-text">
												{{ item.simple_product?.name ?? "—" }}
											</div>
										</td>
										<td class="text-right text-text">
											{{ formatQuantity(item.quantity) }} uds.
										</td>
										<td class="text-right text-text-muted hidden sm:table-cell">—</td>
										<td class="text-right text-text hidden sm:table-cell">
											{{ formatCurrency(item.unit_price) }}
										</td>
									</template>
									<template v-else>
										<td>
											<div class="font-medium text-text">
												{{ item.product_variant?.product?.name ?? "—" }}
											</div>
											<div class="text-text-muted text-xs">
												{{ item.product_variant?.color }} ·
												{{ item.product_variant?.size }}
											</div>
										</td>
										<td class="text-right text-text">
											{{ formatQuantity(item.quantity) }} m²
										</td>
										<td
											class="text-right hidden sm:table-cell"
											:class="boxesFor(item) == null ? 'text-text-muted' : 'text-text'"
										>
											{{ boxesFor(item) ?? "—" }}
										</td>
										<td class="text-right text-text hidden sm:table-cell">
											{{ formatCurrency(item.unit_price) }}/m²
										</td>
									</template>
									<td class="text-right text-text">
										{{ formatCurrency(item.line_total) }}
									</td>
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
							Volver
						</button>
						<button
							type="button"
							@click="acceptCallback"
							class="bg-danger hover:bg-danger/90 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
						>
							Cancelar cotización
						</button>
					</div>
				</div>
			</template>
		</ConfirmDialog>
	</div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import { useQuotesStore } from "@/stores/quotes";
import { statusClasses } from "@/lib/quoteStatus";
import { useDocumentPdf } from "@/composables/useDocumentPdf";
import { useNotify } from "@/composables/useNotify";
import { formatCurrency } from "@/lib/formatCurrency";
import { formatQuantity } from "@/lib/formatQuantity";

const route = useRoute();
const router = useRouter();
const quotes = useQuotesStore();
const confirm = useConfirm();
const notify = useNotify();

const cancelling = ref(false);
const cancelError = ref(null);

// Evita mostrar por un instante una cotización distinta si el store aún
// trae la de una visita anterior.
const quote = computed(() => {
	const current = quotes.currentQuote;
	return current && String(current.id) === String(route.params.id) ? current : null;
});

const { canShareFiles, pdfBusy, pdfError, downloadPdf, sharePdf, reset: resetPdf } = useDocumentPdf({
	fetchPdf: quotes.fetchQuotePdf,
	filePrefix: "Cotizacion",
	titlePrefix: "Cotización",
	id: () => route.params.id,
	document: quote,
});

watch(
	() => route.params.id,
	(id) => {
		resetPdf();
		cancelError.value = null;
		if (id) quotes.fetchQuote(id);
	},
	{ immediate: true },
);

const isEditable = computed(() => quote.value?.status === "Borrador");

// Mismo cálculo que QuoteFormView: quantity está en m², el stock en cajas.
function boxesFor(item) {
	const m2PerBox = item.product_variant?.m2_per_box;
	if (!m2PerBox) return null;
	return Math.ceil((Number(item.quantity) || 0) / m2PerBox);
}

function formatDate(value) {
	return new Date(value).toLocaleString("es-MX", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function editQuote() {
	router.push({ name: "quotes.edit", params: { id: quote.value.id } });
}

function convertToSale() {
	router.push({ name: "pos.sales.create", query: { quote_id: quote.value.id } });
}

function requestCancel() {
	confirm.require({
		header: "Cancelar cotización",
		message: `¿Cancelar la cotización ${quote.value.folio}? Ya no se podrá editar ni convertir a venta. Esta acción no se puede deshacer.`,
		accept: cancelQuote,
	});
}

async function cancelQuote() {
	cancelling.value = true;
	cancelError.value = null;

	try {
		const cancelled = await quotes.cancelQuote(quote.value.id);
		notify.success(`Cotización ${cancelled.folio} cancelada`);
	} catch (err) {
		console.error(err);
		cancelError.value =
			err.response?.status === 422
				? err.response.data.message
				: "No se pudo cancelar la cotización. Intenta de nuevo.";
	} finally {
		cancelling.value = false;
	}
}

function goBack() {
	router.push({ name: "quotes", query: quotes.listQuery });
}
</script>

<style scoped>
.items-table {
	width: 100%;
	border-collapse: collapse;
}
.items-table thead th {
	font-size: 0.75rem;
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
	font-size: 0.875rem;
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
