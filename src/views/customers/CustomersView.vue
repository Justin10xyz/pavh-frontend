<template>
	<div class="p-2">
		<div class="flex items-center justify-between mb-4">
			<h1 class="font-serif text-xl text-primary">Clientes</h1>
			<RouterLink
				:to="{ name: 'customers.create' }"
				class="bg-primary hover:bg-primary-dark text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors inline-flex items-center select-none"
			>
				Nuevo cliente
			</RouterLink>
		</div>

		<div class="flex flex-wrap items-center gap-3 mb-4">
			<div class="relative flex-1 min-w-[220px]">
				<svg
					class="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
					width="14" height="14" viewBox="0 0 24 24" fill="none"
					stroke="currentColor" stroke-width="2"
				>
					<circle cx="11" cy="11" r="7" />
					<line x1="21" y1="21" x2="16.65" y2="16.65" />
				</svg>
				<input
					v-model="searchQuery"
					type="search"
					placeholder="Buscar por nombre, teléfono o correo…"
					aria-label="Buscar clientes"
					class="w-full max-w-md pl-8 pr-3 py-2 text-sm bg-surface border border-border rounded-md text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
				/>
			</div>
		</div>

		<div v-if="customers.error" class="text-danger text-sm">{{ customers.error }}</div>

		<!-- Solo en la primera carga: mientras se busca se deja la tabla anterior
		     visible (atenuada) para que no parpadee con cada tecla. -->
		<div v-else-if="customers.loading && customers.customers.length === 0" class="text-text-muted text-sm">
			Cargando clientes…
		</div>

		<div v-else-if="customers.customers.length === 0" class="text-text-muted text-sm py-8 text-center border border-border rounded-md bg-surface">
			{{ searchQuery.trim() ? 'No se encontraron clientes con esa búsqueda.' : 'Aún no hay clientes registrados.' }}
		</div>

		<div
			v-else
			class="bg-surface border border-border rounded-md overflow-hidden transition-opacity"
			:class="{ 'opacity-60': customers.loading }"
			:aria-busy="customers.loading"
		>
			<DataTable :value="customers.customers" dataKey="id" class="customers-table">
				<Column header="Nombre">
					<template #body="{ data }">
						<RouterLink
							:to="{ name: 'customers.show', params: { id: data.id } }"
							class="font-medium text-text hover:text-accent transition-colors"
						>
							{{ data.name }}
						</RouterLink>
					</template>
				</Column>

				<Column header="Teléfono">
					<template #body="{ data }">
						<span :class="data.phone ? 'text-text' : 'text-text-muted'">{{ data.phone || '—' }}</span>
					</template>
				</Column>

				<Column header="Correo">
					<template #body="{ data }">
						<span :class="data.email ? 'text-text' : 'text-text-muted'">{{ data.email || '—' }}</span>
					</template>
				</Column>

				<Column header="Alta" style="width: 9rem">
					<template #body="{ data }">
						<span class="text-text-muted">{{ formatDate(data.created_at) }}</span>
					</template>
				</Column>
			</DataTable>
		</div>
	</div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useCustomersStore } from '@/stores/customers'

const customers = useCustomersStore()

const searchQuery = ref('')

// Búsqueda server-side (GET /api/customers?search=, scopeSearch() del backend):
// se espera a que el usuario deje de escribir para no disparar una petición
// por tecla. El contador de petición del store descarta respuestas tardías.
const SEARCH_DEBOUNCE_MS = 300
let searchTimer = null

watch(searchQuery, (value) => {
	clearTimeout(searchTimer)
	searchTimer = setTimeout(() => {
		customers.fetchCustomers({ search: value })
	}, SEARCH_DEBOUNCE_MS)
})

onMounted(() => {
	customers.fetchCustomers()
})

onBeforeUnmount(() => {
	clearTimeout(searchTimer)
})

function formatDate(value) {
	if (!value) return '—'
	return new Date(value).toLocaleDateString('es-MX', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	})
}
</script>

<style scoped>
.customers-table :deep(table) {
	width: 100%;
	border-collapse: collapse;
}
.customers-table :deep(thead th) {
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
.customers-table :deep(tbody > tr > td) {
	padding: 0.5rem 0.75rem;
	vertical-align: middle;
	border-bottom: 1px solid var(--color-border);
	font-size: 0.8125rem;
}
.customers-table :deep(tbody > tr:last-child > td) {
	border-bottom: none;
}
.customers-table :deep(tbody > tr:hover) {
	background: var(--color-bg);
}
</style>
