<template>
    <div class="p-2">
        <div class="flex items-center justify-between gap-3 mb-4">
            <div class="flex items-center gap-3">
                <!-- Volver en línea con el título, igual que en los detalles. Por
				     debajo de lg solo la flecha. -->
                <RouterLink
                    :to="{ name: 'settings.index' }"
                    aria-label="Volver a configuración"
                    title="Volver a configuración"
                    class="shrink-0 inline-flex items-center justify-center gap-1.5 h-8 w-8 lg:w-auto lg:px-3 bg-surface border border-border hover:bg-bg text-text-muted hover:text-text text-sm font-medium rounded-md transition-colors select-none"
                >
                    <i class="ti ti-arrow-left text-base" aria-hidden="true"></i>
                    <span class="hidden lg:inline">Volver</span>
                </RouterLink>
                <h1 class="font-serif text-xl text-primary">{{ route.meta.title }}</h1>
            </div>
            <!-- Solo con el catálogo cargado: crear a media carga agregaría el
			     proveedor a un arreglo que la respuesta pendiente luego reemplaza. -->
            <button
                v-if="catalogs.initialized"
                type="button"
                class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-10 px-4 rounded-md transition-colors inline-flex items-center select-none cursor-pointer"
                @click="openCreate"
            >
                Nuevo proveedor
            </button>
        </div>

        <p v-if="deleteError" class="text-danger text-sm mb-4 flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2" role="alert">
            <i class="ti ti-alert-triangle text-sm shrink-0" aria-hidden="true"></i>
            {{ deleteError }}
        </p>

        <div v-if="catalogs.loading" class="text-text-muted text-sm">Cargando proveedores…</div>
        <div v-else-if="catalogs.error" class="text-danger text-sm">{{ catalogs.error }}</div>

        <div
            v-else-if="catalogs.suppliers.length === 0"
            class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface"
        >
            Todavía no hay proveedores registrados.
        </div>

        <template v-else>
            <p class="text-sm text-text-muted mb-2 sm:text-right" aria-live="polite">
                {{ catalogs.suppliers.length }} {{ catalogs.suppliers.length === 1 ? 'proveedor' : 'proveedores' }}
            </p>

            <div class="bg-surface border border-border rounded-md overflow-hidden">
                <DataTable
                    :value="catalogs.suppliers"
                    dataKey="id"
                    class="data-table"
                    :row-class="() => 'cursor-pointer'"
                    @row-click="onRowClick"
                >
                    <Column header="Nombre">
                        <template #body="{ data }">
                            <span class="font-medium text-text">{{ data.name }}</span>
                        </template>
                    </Column>

                    <Column header="" body-class="w-px">
                        <template #body="{ data }">
                            <div class="flex items-center gap-1">
                                <button
                                    type="button"
                                    class="flex items-center p-1.5 lg:p-1 rounded text-text-muted hover:bg-bg hover:text-accent transition-colors cursor-pointer"
                                    :aria-label="`Editar proveedor ${data.name}`"
                                    :title="`Editar proveedor ${data.name}`"
                                    @click="openEdit(data)"
                                >
                                    <i class="ti ti-pencil text-base" aria-hidden="true"></i>
                                </button>
                                <button
                                    type="button"
                                    class="flex items-center p-1.5 lg:p-1 rounded text-text-muted hover:bg-bg hover:text-danger transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    :disabled="busyId === data.id"
                                    :aria-label="`Eliminar proveedor ${data.name}`"
                                    :title="`Eliminar proveedor ${data.name}`"
                                    @click="requestDelete(data)"
                                >
                                    <i class="ti ti-trash text-base" aria-hidden="true"></i>
                                </button>
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </template>

        <SupplierFormDialog v-model:visible="dialogVisible" :supplier="selectedSupplier" />

        <!-- Con `blocked` (el proveedor tiene productos) solo se informa el motivo:
		     no hay nada que confirmar. -->
        <ConfirmDialog :pt="{ mask: { class: 'bg-primary/50' } }">
            <template #container="{ message, acceptCallback, rejectCallback }">
                <div class="bg-surface border border-border rounded-md p-5 w-[380px] max-w-[90vw]">
                    <h3 class="font-serif text-base text-primary mb-2">{{ message.header }}</h3>
                    <p class="text-sm text-text-muted mb-5">{{ message.message }}</p>
                    <div class="flex items-center justify-end gap-3">
                        <button
                            v-if="message.blocked"
                            type="button"
                            @click="rejectCallback"
                            class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                        >
                            Entendido
                        </button>
                        <template v-else>
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
                        </template>
                    </div>
                </div>
            </template>
        </ConfirmDialog>
    </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import axios from "@/lib/axios";
import { useNotify } from "@/composables/useNotify";
import { useCatalogsStore } from "@/stores/catalogs";
import SupplierFormDialog from "@/components/widgets/dialogs/SupplierFormDialog.vue";

const route = useRoute();
const catalogs = useCatalogsStore();
const confirm = useConfirm();
const notify = useNotify();

onMounted(() => {
    if (!catalogs.initialized) catalogs.fetchCatalogs();
});

const dialogVisible = ref(false);
const selectedSupplier = ref(null);

function openCreate() {
    selectedSupplier.value = null;
    dialogVisible.value = true;
}

function openEdit(supplier) {
    selectedSupplier.value = supplier;
    dialogVisible.value = true;
}

// Toda la fila abre la edición, como en los demás listados (aquí el destino es
// un diálogo, no una ruta). El lápiz sigue siendo el acceso por teclado; su
// propio clic ya abre el diálogo, así que se ignora aquí para no abrirlo dos veces.
function onRowClick({ originalEvent, data }) {
    if (originalEvent.target.closest("a, button")) return;
    openEdit(data);
}

// id del proveedor en proceso (pidiendo resumen o borrando), para
// deshabilitar su botón y no abrir dos diálogos.
const busyId = ref(null);
const deleteError = ref(null);

// Mismo flujo que CategoriesSettingsView: con productos activos el backend no
// deja borrar, así que se muestra el motivo en vez de pedir una confirmación
// que fallaría. Si el resumen falla se confirma igual; el DELETE vuelve a
// validar y su 422 llega a `deleteError`.
async function requestDelete(supplier) {
    if (busyId.value) return;

    busyId.value = supplier.id;
    deleteError.value = null;

    let summary = null;
    try {
        const { data } = await axios.get(`/api/suppliers/${supplier.id}/delete-summary`);
        summary = data.data;
    } catch (err) {
        console.error(err);
    } finally {
        busyId.value = null;
    }

    if (summary?.blocked_message) {
        confirm.require({
            header: "No se puede eliminar",
            message: summary.blocked_message,
            blocked: true,
        });
        return;
    }

    confirm.require({
        header: "Eliminar proveedor",
        message: `¿Seguro que quieres eliminar el proveedor "${supplier.name}"? Esta acción no se puede deshacer.`,
        accept: () => deleteSupplier(supplier),
    });
}

async function deleteSupplier(supplier) {
    busyId.value = supplier.id;

    try {
        await axios.delete(`/api/suppliers/${supplier.id}`);
        catalogs.removeSupplier(supplier.id);
        notify.success("Proveedor eliminado", supplier.name);
    } catch (err) {
        console.error(err);
        if (err.response?.status === 404) {
            // Ya lo había eliminado alguien más: se quita igual de la lista.
            catalogs.removeSupplier(supplier.id);
            deleteError.value = "El proveedor ya no existe.";
        } else {
            deleteError.value =
                err.response?.status === 422
                    ? err.response.data.message
                    : "No se pudo eliminar el proveedor. Intenta de nuevo.";
        }
    } finally {
        busyId.value = null;
    }
}
</script>

<style scoped></style>
