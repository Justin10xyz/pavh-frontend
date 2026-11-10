<template>
    <!-- PrimeVue calcula la ventana de páginas y el estado; el markup va por el slot
         `container` para estilizarlo aquí y tener las etiquetas en español (las
         aria-label por defecto de PrimeVue vienen en inglés). -->
    <Paginator
        :first="(page - 1) * rows"
        :rows="rows"
        :total-records="totalRecords"
        :page-link-size="5"
        always-show
        aria-label="Paginación"
        @page="(state) => (page = state.page + 1)"
    >
        <template
            #container="{
                first,
                last,
                page: pageIndex,
                pageCount,
                pageLinks,
                firstPageCallback,
                prevPageCallback,
                nextPageCallback,
                lastPageCallback,
                changePageCallback,
            }"
        >
            <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mt-3">
                <p class="text-sm text-text-muted tabular-nums" aria-live="polite">
                    Mostrando {{ first }}–{{ last }} de {{ totalRecords }} {{ itemLabel }}
                </p>

                <div class="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <div v-if="pageCount > 1" class="flex items-center gap-1">
                        <button
                            type="button"
                            :class="navButtonClass"
                            :disabled="pageIndex === 0"
                            aria-label="Primera página"
                            title="Primera página"
                            @click="firstPageCallback"
                        >
                            <i class="ti ti-chevrons-left text-base" aria-hidden="true"></i>
                        </button>
                        <button
                            type="button"
                            :class="navButtonClass"
                            :disabled="pageIndex === 0"
                            aria-label="Página anterior"
                            title="Página anterior"
                            @click="prevPageCallback"
                        >
                            <i class="ti ti-chevron-left text-base" aria-hidden="true"></i>
                        </button>

                        <button
                            v-for="pageLink in pageLinks"
                            :key="pageLink"
                            type="button"
                            class="h-8 min-w-8 px-2 text-sm rounded-md border tabular-nums transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                            :class="
                                pageLink - 1 === pageIndex
                                    ? 'bg-surface border-accent text-text font-medium'
                                    : 'border-transparent text-text-muted hover:bg-bg hover:text-text'
                            "
                            :aria-label="`Página ${pageLink}`"
                            :aria-current="pageLink - 1 === pageIndex ? 'page' : undefined"
                            @click="changePageCallback(pageLink - 1)"
                        >
                            {{ pageLink }}
                        </button>

                        <button
                            type="button"
                            :class="navButtonClass"
                            :disabled="pageIndex === pageCount - 1"
                            aria-label="Página siguiente"
                            title="Página siguiente"
                            @click="nextPageCallback"
                        >
                            <i class="ti ti-chevron-right text-base" aria-hidden="true"></i>
                        </button>
                        <button
                            type="button"
                            :class="navButtonClass"
                            :disabled="pageIndex === pageCount - 1"
                            aria-label="Última página"
                            title="Última página"
                            @click="lastPageCallback"
                        >
                            <i class="ti ti-chevrons-right text-base" aria-hidden="true"></i>
                        </button>
                    </div>

                    <div class="flex items-center gap-2">
                        <label :for="rowsSelectId" class="text-sm text-text-muted whitespace-nowrap">Por página</label>
                        <div class="w-20">
                            <SelectCustom
                                :id="rowsSelectId"
                                :model-value="rows"
                                :options="rowsPerPageOptions"
                                @update:model-value="changeRows"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </Paginator>
</template>

<script setup>
import { useId } from "vue";
import Paginator from "primevue/paginator";
import SelectCustom from "@/components/widgets/SelectCustom.vue";
import { DEFAULT_ROWS_PER_PAGE, ROWS_PER_PAGE_OPTIONS } from "@/lib/pagination";

defineProps({
    totalRecords: { type: Number, required: true },
    // Plural de lo que se lista, para "Mostrando 1–20 de 134 productos".
    itemLabel: { type: String, default: "registros" },
    rowsPerPageOptions: { type: Array, default: () => ROWS_PER_PAGE_OPTIONS },
});

// Página 1-based (la misma que va en la URL).
const page = defineModel("page", { type: Number, default: 1 });
const rows = defineModel("rows", { type: Number, default: DEFAULT_ROWS_PER_PAGE });

const rowsSelectId = useId();

const navButtonClass =
    "flex items-center justify-center h-8 w-8 rounded-md text-text-muted hover:bg-bg hover:text-text transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent";

// Al cambiar el tamaño se vuelve a la página 1: la posición anterior ya no
// corresponde a la misma página.
function changeRows(value) {
    rows.value = value;
    page.value = 1;
}
</script>
