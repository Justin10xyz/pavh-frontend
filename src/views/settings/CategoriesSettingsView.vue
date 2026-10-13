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
			<!-- Solo con el catálogo cargado: crear a media carga agregaría la
			     categoría a un arreglo que la respuesta pendiente luego reemplaza. -->
			<button
				v-if="catalogs.initialized"
				type="button"
				class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-10 px-4 rounded-md transition-colors inline-flex items-center select-none cursor-pointer"
				@click="openCreate"
			>
				Nueva categoría
			</button>
		</div>

		<div v-if="catalogs.loading" class="text-text-muted text-sm">Cargando categorías…</div>
		<div v-else-if="catalogs.error" class="text-danger text-sm">{{ catalogs.error }}</div>

		<div
			v-else-if="catalogs.categories.length === 0"
			class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface"
		>
			Todavía no hay categorías registradas.
		</div>

		<template v-else>
			<p class="text-sm text-text-muted mb-2 sm:text-right" aria-live="polite">
				{{ catalogs.categories.length }} {{ catalogs.categories.length === 1 ? 'categoría' : 'categorías' }}
			</p>

			<div class="bg-surface border border-border rounded-md overflow-hidden">
				<DataTable
					:value="catalogs.categories"
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

					<Column header="Prefijo" style="width: 9rem">
						<template #body="{ data }">
							<span class="inline-block px-2 py-0.5 bg-bg border border-border rounded text-xs font-medium text-text-muted">
								{{ data.code_prefix }}
							</span>
						</template>
					</Column>

					<Column header="Tipo" style="width: 9rem">
						<template #body="{ data }">
							<span class="text-text">{{ productFormTypeShortLabel(data.product_form_type) }}</span>
						</template>
					</Column>

					<Column header="" body-class="w-px">
						<template #body="{ data }">
							<button
								type="button"
								class="flex items-center p-1.5 lg:p-1 rounded text-text-muted hover:bg-bg hover:text-accent transition-colors cursor-pointer"
								:aria-label="`Editar categoría ${data.name}`"
								:title="`Editar categoría ${data.name}`"
								@click="openEdit(data)"
							>
								<i class="ti ti-pencil text-base" aria-hidden="true"></i>
							</button>
						</template>
					</Column>
				</DataTable>
			</div>
		</template>

		<CategoryFormDialog v-model:visible="dialogVisible" :category="selectedCategory" />
	</div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { useCatalogsStore } from "@/stores/catalogs";
import CategoryFormDialog from "./components/CategoryFormDialog.vue";
import { productFormTypeShortLabel } from "@/lib/productFormTypes";

const route = useRoute();
const catalogs = useCatalogsStore();

onMounted(() => {
	if (!catalogs.initialized) catalogs.fetchCatalogs();
});

const dialogVisible = ref(false);
const selectedCategory = ref(null);

function openCreate() {
	selectedCategory.value = null;
	dialogVisible.value = true;
}

function openEdit(category) {
	selectedCategory.value = category;
	dialogVisible.value = true;
}

// Toda la fila abre la edición, como en los demás listados (aquí el destino es
// un diálogo, no una ruta). El lápiz sigue siendo el acceso por teclado; su
// propio clic ya abre el diálogo, así que se ignora aquí para no abrirlo dos veces.
function onRowClick({ originalEvent, data }) {
	if (originalEvent.target.closest("a, button")) return;
	openEdit(data);
}
</script>

<style scoped></style>
