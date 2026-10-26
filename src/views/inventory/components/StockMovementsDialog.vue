<template>
    <Dialog
        v-model:visible="visible"
        modal
        :pt="{ mask: { class: 'bg-primary/50' } }"
        @show="fetchMovements"
        @hide="reset"
    >
        <template #container="{ closeCallback }">
            <div
                v-if="url"
                class="bg-surface border border-border rounded-md p-4 sm:p-5 w-160 max-w-[90vw] max-h-[85vh] flex flex-col"
            >
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-serif text-base text-primary">Historial de stock</h3>
                    <button
                        type="button"
                        @click="closeCallback"
                        class="text-text-muted hover:text-text transition-colors cursor-pointer"
                        aria-label="Cerrar"
                    >
                        <i class="ti ti-x text-base"></i>
                    </button>
                </div>

                <div class="text-sm text-text mb-4">
                    <span v-if="subtitle" class="text-text-muted">{{ subtitle }} · </span>
                    <template v-if="stock !== null && stock !== undefined">
                        Stock actual:
                        <span class="font-medium">{{ stock }} {{ stockUnit }}</span>
                    </template>
                    <span v-else class="font-medium">Sin control de stock</span>
                </div>

                <div v-if="loading" class="text-text-muted text-sm py-6 text-center">
                    Cargando historial…
                </div>
                <div v-else-if="error" class="text-danger text-sm py-6 text-center">
                    {{ error }}
                </div>
                <div
                    v-else-if="movements.length === 0"
                    class="text-text-muted text-sm py-6 text-center border border-border rounded-md"
                >
                    Aún no hay movimientos registrados.
                </div>

                <div
                    v-else
                    class="border border-border rounded-md overflow-auto min-h-0"
                >
                    <table class="w-full text-xs">
                        <thead class="sticky top-0 bg-bg">
                            <tr class="text-text-muted uppercase text-[10px]">
                                <th class="text-left font-medium py-2 px-3">Fecha</th>
                                <th class="text-left font-medium py-2 px-3">Tipo</th>
                                <th class="text-right font-medium py-2 px-3">Cantidad</th>
                                <th class="text-left font-medium py-2 px-3">Origen</th>
                                <th class="text-right font-medium py-2 px-3">
                                    Stock resultante
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="movement in movements"
                                :key="movement.id"
                                class="border-t border-border"
                            >
                                <td class="py-2 px-3 text-text-muted whitespace-nowrap">
                                    {{ formatDateTime(movement.created_at) }}
                                </td>
                                <td class="py-2 px-3">
                                    <!-- 'deactivated' se guarda como 'subtract', pero no es una salida:
										 se mira `source` antes que `type`. -->
                                    <span
                                        v-if="movement.source === 'deactivated'"
                                        class="text-[10px] px-2 py-0.5 rounded border border-border text-text-muted"
                                    >
                                        Desactivado
                                    </span>
                                    <span
                                        v-else
                                        class="text-[10px] px-2 py-0.5 rounded"
                                        :class="
                                            movement.type === 'add'
                                                ? 'bg-success/10 text-success'
                                                : 'bg-danger/10 text-danger'
                                        "
                                    >
                                        {{ movement.type === "add" ? "Entrada" : "Salida" }}
                                    </span>
                                </td>
                                <td class="py-2 px-3 text-right text-text whitespace-nowrap">
                                    <span
                                        v-if="movement.source === 'deactivated'"
                                        class="text-text-muted"
                                    >—</span
                                    >
                                    <template v-else>
                                        {{ movement.type === "add" ? "+" : "−"
                                        }}{{ movement.quantity }} {{ stockUnit }}
                                    </template>
                                </td>
                                <td class="py-2 px-3 text-text">
                                    <!-- Ventas: solo el folio, sin enlace (el módulo de ventas ya no existe). -->
                                    <span
                                        v-if="movement.source === 'sale'"
                                        class="font-mono text-[11px]"
                                    >{{ movement.sale_folio ?? "Venta" }}</span
                                    >
                                    <span v-else-if="movement.source === 'initial'"
                                    >Stock inicial</span
                                    >
                                    <span v-else-if="movement.source === 'deactivated'"
                                    >Seguimiento desactivado</span
                                    >
                                    <span v-else>Ajuste manual</span>
                                </td>
                                <td class="py-2 px-3 text-right text-text whitespace-nowrap">
                                    <!-- `quantity` de una desactivación es el stock que había antes. -->
                                    <span
                                        v-if="movement.source === 'deactivated'"
                                        class="text-text-muted"
                                    >
                                        Sin control (antes: {{ movement.quantity }} {{ stockUnit }})
                                    </span>
                                    <span
                                        v-else-if="movement.resulting_stock === null"
                                        class="text-text-muted"
                                    >—</span
                                    >
                                    <template v-else
                                    >{{ movement.resulting_stock }} {{ stockUnit }}</template
                                    >
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>
    </Dialog>
</template>

<script setup>
import { ref } from "vue";
import Dialog from "primevue/dialog";
import axios from "@/lib/axios";
import { formatDateTime } from "@/lib/dates";

// Solo lectura y agnóstico del tipo de producto, igual que StockAdjustDialog:
// recibe el endpoint GET del historial. La consulta es puntual al abrir, así
// que no vive en un store.
const props = defineProps({
    // Endpoint GET del historial (ej. `/api/product-variants/5/stock-movements`). Sin él no se muestra nada.
    url: { type: String, default: null },
    stock: { type: Number, default: null },
    stockUnit: { type: String, default: "" },
    // Contexto opcional antes del stock actual (ej. el color de la variante).
    subtitle: { type: String, default: "" },
});

const visible = defineModel("visible", { type: Boolean, default: false });

const movements = ref([]);
const loading = ref(false);
const error = ref(null);

// Si se cierra y se reabre para otro producto antes de que responda la
// petición anterior, su respuesta se descarta.
let requestId = 0;

async function fetchMovements() {
    if (!props.url) return;

    const current = ++requestId;
    loading.value = true;
    error.value = null;

    try {
        const { data } = await axios.get(props.url);
        if (current !== requestId) return;
        movements.value = data.data;
    } catch (err) {
        if (current !== requestId) return;
        console.error(err);
        error.value = "No se pudo cargar el historial. Intenta de nuevo.";
    } finally {
        if (current === requestId) loading.value = false;
    }
}

function reset() {
    requestId++;
    movements.value = [];
    loading.value = false;
    error.value = null;
}
</script>
