<template>
    <div class="p-2">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h1 class="font-serif text-xl text-primary">Presupuestos</h1>
            <RouterLink
                :to="{ name: 'quotes.create' }"
                class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-10 px-4 rounded-md transition-colors inline-flex items-center select-none"
            >
                Nuevo presupuesto
            </RouterLink>
        </div>

        <div v-if="quotes.loading" class="text-text-muted text-sm">Cargando presupuestos…</div>
        <div v-else-if="quotes.error" class="text-danger text-sm">{{ quotes.error }}</div>

        <template v-else>
            <div class="flex flex-wrap items-center gap-3 mb-4">
                <div class="relative flex-1 min-w-56">
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
                        class="max-w-md pl-8"
                    />
                </div>

                <QuickFilter
                    v-model="statusFilter"
                    :options="statusOptions"
                    label="Filtrar por estado"
                />
            </div>

            <div
                v-if="filteredQuotes.length === 0"
                class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface"
            >
                {{
                    quotes.quotes.length === 0
                        ? "Aún no hay presupuestos registrados."
                        : "No se encontraron presupuestos con esos filtros."
                }}
            </div>

            <div v-else class="bg-surface border border-border rounded-md overflow-x-auto">
                <DataTable
                    :value="filteredQuotes"
                    dataKey="id"
                    class="data-table"
                    :row-class="() => 'cursor-pointer'"
                    @row-click="openQuote"
                >
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
                                formatDateTime(data.created_at)
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
                            <span class="text-text-muted">{{ formatDateTime(data.created_at) }}</span>
                        </template>
                    </Column>

                    <Column header="Estado">
                        <template #body="{ data }">
                            <div class="flex flex-col items-start gap-1">
                                <span
                                    class="text-xs px-2 py-0.5 rounded whitespace-nowrap"
                                    :class="statusClasses(data.status)"
                                >
                                    {{ statusLabel(data.status) }}
                                </span>
                                <!-- Solo en Pagada: `comprobante` viene de ?with=comprobante (null si no se ha generado). -->
                                <template v-if="data.status === 'Pagada'">
                                    <RouterLink
                                        v-if="data.comprobante"
                                        :to="{ name: 'comprobantes.show', params: { id: data.comprobante.id } }"
                                        class="text-xs text-accent hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                                    >
                                        <i class="ti ti-file-check text-sm" aria-hidden="true"></i>
                                        {{ data.comprobante.folio }}
                                    </RouterLink>
                                    <span
                                        v-else
                                        class="text-xs text-amber-600 inline-flex items-center gap-1 whitespace-nowrap"
                                    >
                                        <i class="ti ti-file-alert text-sm" aria-hidden="true"></i>
                                        Sin comprobante
                                    </span>
                                </template>
                            </div>
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
                                aria-label="Ver presupuesto"
                                title="Ver presupuesto"
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
import { onMounted, ref, computed, watch } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useQuotesStore } from "@/stores/quotes";
import { useRoute, useRouter } from "vue-router";
import { QUOTE_STATUSES, statusClasses, statusLabel } from "@/lib/quoteStatus";
import { formatCurrency } from "@/lib/formatCurrency";
import InputTextCustom from "@/components/widgets/InputTextCustom.vue";
import QuickFilter from "@/components/widgets/filters/QuickFilter.vue";
import { formatDateTime } from "@/lib/dates";

const route = useRoute();
const router = useRouter();
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

// Filtro por status client-side: el listado ya trae todas las cotizaciones
// (QuoteController@index no pagina ni filtra), igual que la búsqueda.
//
// El status activo vive en la URL (?estado=Borrador), no en un ref: así se
// conserva al volver del detalle con Atrás y se puede enlazar directo (ej.
// "Ver todo" del widget de cotizaciones activas). Un valor desconocido en la
// URL cae a "Todas". Se usa replace para no llenar el historial de filtros.
//
// "sin-comprobante" no es un status: son las Pagadas que aún no tienen
// comprobante, la bandeja de trabajo del flujo Presupuesto → Comprobante.
const PENDING_COMPROBANTE = "sin-comprobante";

function isPendingComprobante(quote) {
    return quote.status === "Pagada" && !quote.comprobante;
}

const statusFilter = computed({
    get: () =>
        QUOTE_STATUSES.includes(route.query.estado) || route.query.estado === PENDING_COMPROBANTE
            ? route.query.estado
            : "all",
    set: (key) => {
        router.replace({
            query: { ...route.query, estado: key === "all" ? undefined : key },
        });
    },
});

// El "Volver" del detalle regresa al listado con el mismo filtro, aunque se
// haya pasado por la edición (donde Atrás del navegador ya no aplica).
// Se filtra por nombre de ruta: al navegar al detalle, `route` ya cambió antes
// de que este componente se desmonte, y sin el guard se guardaría el query del
// detalle (vacío).
watch(
    () => route.query,
    (query) => {
        if (route.name === "quotes") quotes.listQuery = { ...query };
    },
    { immediate: true },
);

// `key` es el valor real (filtro y ?estado=); `label` solo el texto visible.
const statusOptions = computed(() => [
    { key: "all", label: "Todos", count: quotes.quotes.length },
    ...QUOTE_STATUSES.map((status) => ({
        key: status,
        label: statusLabel(status),
        count: quotes.quotes.filter((quote) => quote.status === status).length,
    })),
    {
        key: PENDING_COMPROBANTE,
        label: "Sin comprobante",
        count: quotes.quotes.filter(isPendingComprobante).length,
    },
]);

function matchesStatusFilter(quote) {
    if (statusFilter.value === "all") return true;
    if (statusFilter.value === PENDING_COMPROBANTE) return isPendingComprobante(quote);
    return quote.status === statusFilter.value;
}

const filteredQuotes = computed(() => {
    const q = normalize(searchQuery.value);

    return quotes.quotes.filter(
        (quote) =>
            matchesStatusFilter(quote) &&
            (!q || normalize(quote.folio).includes(q) || normalize(quote.customer?.name).includes(q)),
    );
});

// Toda la fila abre el detalle. Los clicks sobre un link propio (folio, ojo)
// se dejan al RouterLink, que ya soporta Ctrl/Cmd+click y click medio.
function openQuote({ originalEvent, data }) {
    if (originalEvent.target.closest("a, button")) return;

    const to = { name: "quotes.show", params: { id: data.id } };
    if (originalEvent.ctrlKey || originalEvent.metaKey) {
        window.open(router.resolve(to).href, "_blank");
    } else {
        router.push(to);
    }
}
</script>

<style scoped></style>
