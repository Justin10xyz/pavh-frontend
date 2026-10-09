<template>
	<div class="p-2">
		<div class="flex items-center justify-between mb-4">
			<h1 class="font-serif text-xl text-primary">{{ route.meta.title }}</h1>
			<button
				type="button"
				class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors inline-flex items-center select-none cursor-pointer"
				@click="openCreate"
			>
				Nueva categoría
			</button>
		</div>

		<div v-if="catalogs.loading" class="text-text-muted text-sm">Cargando categorías…</div>
		<div v-else-if="catalogs.error" class="text-danger text-sm">{{ catalogs.error }}</div>

		<div v-else-if="catalogs.categories.length === 0" class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface">
			Todavía no hay categorías registradas.
		</div>

		<div v-else class="bg-surface border border-border rounded-md overflow-hidden">
			<DataTable :value="catalogs.categories" dataKey="id" class="categories-table">
				<Column header="Nombre">
					<template #body="{ data }">
						<span class="font-medium text-text">{{ data.name }}</span>
					</template>
				</Column>

				<Column header="Prefijo" style="width: 9rem">
					<template #body="{ data }">
						<span class="text-text-muted">{{ data.code_prefix }}</span>
					</template>
				</Column>

				<Column header="" style="width: 3rem">
					<template #body="{ data }">
						<button
							type="button"
							class="text-text-muted hover:text-accent transition-colors"
							aria-label="Editar categoría"
							title="Editar categoría"
							@click="openEdit(data)"
						>
							<i class="ti ti-pencil text-[15px]"></i>
						</button>
					</template>
				</Column>
			</DataTable>
		</div>

		<CategoryFormDialog v-model:visible="dialogVisible" :category="selectedCategory" />
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useCatalogsStore } from '@/stores/catalogs'
import CategoryFormDialog from './components/CategoryFormDialog.vue'

const route = useRoute()
const catalogs = useCatalogsStore()

onMounted(() => {
	if (!catalogs.initialized) catalogs.fetchCatalogs()
})

const dialogVisible = ref(false)
const selectedCategory = ref(null)

function openCreate() {
	selectedCategory.value = null
	dialogVisible.value = true
}

function openEdit(category) {
	selectedCategory.value = category
	dialogVisible.value = true
}
</script>

<style scoped>
.categories-table :deep(table) {
	width: 100%;
	border-collapse: collapse;
}
.categories-table :deep(thead th) {
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
.categories-table :deep(tbody > tr > td) {
	padding: 0.5rem 0.75rem;
	vertical-align: middle;
	border-bottom: 1px solid var(--color-border);
	font-size: 0.8125rem;
}
.categories-table :deep(tbody > tr:last-child > td) {
	border-bottom: none;
}
.categories-table :deep(tbody > tr:hover) {
	background: var(--color-bg);
}
</style>
