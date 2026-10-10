<template>
	<div class="p-2">
		<div class="flex flex-wrap items-center justify-between gap-3 mb-4">
			<h1 class="font-serif text-xl text-primary">Cotizaciones</h1>
			<RouterLink
				:to="{ name: 'quotes.create' }"
				class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-10 px-4 rounded-md transition-colors inline-flex items-center select-none"
			>
				Nueva cotización
			</RouterLink>
		</div>

		<div v-if="quotes.loading" class="text-text-muted text-sm">Cargando cotizaciones…</div>
		<div v-else-if="quotes.error" class="text-danger text-sm">{{ quotes.error }}</div>

		<template v-else>
			<div class="relative max-w-md mb-4">
				<svg
					class="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<circle cx="11" cy="11" r="7" />
					<line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
				<InputTextCustom
					v-model="searchQuery"
					placeholder="Buscar por folio o cliente…"
					class="pl-8"
				/>
			</div>

			<div
				v-if="filteredQuotes.length === 0"
				class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface"
			>
				{{
					quotes.quotes.length === 0
						? "Aún no hay cotizaciones registradas."
						: "No se encontraron cotizaciones con esa búsqueda."
				}}
			</div>

			<div v-else class="bg-surface border border-border rounded-md overflow-x-auto">
				<DataTable :value="filteredQuotes" dataKey="id" class="quotes-table">
					<Column header="Folio" body-class="whitespace-nowrap">
						<template #body="{ data }">
							<RouterLink
								:to="{ name: 'quotes.show', params: { id: data.id } }"
								class="font-medium text-text hover:text-accent transition-colors"
							>
								{{ data.folio }}
							</RouterLink>
							<!-- Sin columna Fecha por debajo de sm: va debajo del folio -->
							<span class="block sm:hidden text-xs text-text-muted">{{
								formatDate(data.created_at)
							}}</span>
						</template>
					</Column>

					<Column header="Cliente">
						<template #body="{ data }">
							<span :class="data.customer ? 'text-text' : 'text-text-muted'">
								{{ data.customer?.name ?? "Sin cliente" }}
							</span>
						</template>
					</Column>

					<Column
						header="Fecha"
						header-class="hidden sm:table-cell"
						body-class="hidden sm:table-cell whitespace-nowrap"
					>
						<template #body="{ data }">
							<span class="text-text-muted">{{ formatDate(data.created_at) }}</span>
						</template>
					</Column>

					<Column header="Estado">
						<template #body="{ data }">
							<span
								class="text-xs px-2 py-0.5 rounded whitespace-nowrap"
								:class="statusClasses(data.status)"
							>
								{{ data.status }}
							</span>
						</template>
					</Column>

					<Column
						header="Total"
						header-class="text-right!"
						body-class="text-right whitespace-nowrap"
					>
						<template #body="{ data }">
							<span class="font-semibold text-primary tabular-nums">{{
								formatCurrency(data.total)
							}}</span>
						</template>
					</Column>

					<Column header="" body-class="w-px">
						<template #body="{ data }">
							<RouterLink
								:to="{ name: 'quotes.show', params: { id: data.id } }"
								class="flex items-center p-1.5 lg:p-1 rounded text-text-muted hover:bg-bg hover:text-accent transition-colors cursor-pointer"
								aria-label="Ver cotización"
								title="Ver cotización"
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
import { onMounted, ref, computed } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useQuotesStore } from "@/stores/quotes";
import { statusClasses } from "@/lib/quoteStatus";
import { formatCurrency } from "@/lib/formatCurrency";
import InputTextCustom from "@/components/widgets/InputTextCustom.vue";

const quotes = useQuotesStore();

onMounted(() => {
	if (!quotes.initialized) quotes.fetchQuotes();
});

const searchQuery = ref("");

function normalize(str) {
	return (str ?? "")
		.toString()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase();
}

const filteredQuotes = computed(() => {
	const q = normalize(searchQuery.value);
	if (!q) return quotes.quotes;

	return quotes.quotes.filter(
		(quote) =>
			normalize(quote.folio).includes(q) || normalize(quote.customer?.name).includes(q),
	);
});

function formatDate(value) {
	return new Date(value).toLocaleDateString("es-MX", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}
</script>

<style scoped>
.quotes-table :deep(table) {
	width: 100%;
	border-collapse: collapse;
}
.quotes-table :deep(thead th) {
	text-align: left;
	font-size: 11px;
	font-weight: 500;
	text-transform: uppercase;
	letter-spacing: 0.03em;
	color: var(--color-text-muted);
	background: var(--color-bg);
	padding: 0.5rem 0.75rem;
	border-bottom: 1px solid var(--color-border);
}
.quotes-table :deep(tbody > tr > td) {
	padding: 0.5rem 0.75rem;
	vertical-align: middle;
	border-bottom: 1px solid var(--color-border);
	font-size: 0.8125rem;
}
.quotes-table :deep(tbody > tr:last-child > td) {
	border-bottom: none;
}
.quotes-table :deep(tbody > tr) {
	transition: background-color 150ms ease;
}
/* Al 60% para que el hover del botón de acción (bg-bg) se distinga del de la fila. */
.quotes-table :deep(tbody > tr:hover) {
	background: color-mix(in oklab, var(--color-bg) 60%, transparent);
}
</style>
