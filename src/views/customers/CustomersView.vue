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
				<InputTextCustom
					v-model="searchQuery"
					type="search"
					placeholder="Buscar por nombre, teléfono o correo…"
					aria-label="Buscar clientes"
					class="max-w-md pl-8"
				/>
			</div>
		</div>

		<p v-if="deleteError" class="text-danger text-[13px] mb-4 flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
			<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			{{ deleteError }}
		</p>

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

				<Column header="" style="width: 3rem">
					<template #body="{ data }">
						<button
							type="button"
							class="text-text-muted hover:text-danger transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							:disabled="busyId === data.id"
							aria-label="Eliminar cliente"
							title="Eliminar cliente"
							@click="requestDelete(data)"
						>
							<i class="ti ti-trash text-[15px]"></i>
						</button>
					</template>
				</Column>
			</DataTable>
		</div>

		<ConfirmDialog :pt="{ mask: { class: 'bg-primary/50' } }">
			<template #container="{ message, acceptCallback, rejectCallback }">
				<div class="bg-surface border border-border rounded-md p-5 w-[380px] max-w-[90vw]">
					<h3 class="font-serif text-base text-primary mb-2">{{ message.header }}</h3>
					<p class="text-sm text-text-muted mb-5">{{ message.message }}</p>
					<div class="flex items-center justify-end gap-3">
						<button
							type="button"
							@click="rejectCallback"
							class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
						>
							Cancelar
						</button>
						<button
							type="button"
							@click="acceptCallback"
							class="bg-danger hover:bg-danger/90 text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
						>
							Eliminar
						</button>
					</div>
				</div>
			</template>
		</ConfirmDialog>
	</div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import { useCustomersStore } from '@/stores/customers'
import { useCustomerDelete } from '@/composables/useCustomerDelete'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'

const customers = useCustomersStore()

// La fila se quita in-place en customers.deleteCustomer(); no hay nada más que hacer.
const { busyId, deleteError, requestDelete } = useCustomerDelete()

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
