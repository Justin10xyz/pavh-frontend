<template>
	<div class="flex items-start gap-2">
		<div class="relative flex-1 min-w-0">
			<!-- Cliente elegido: clic en el nombre para cambiarlo, × para dejar "Sin cliente".
			     Nombre y contacto en renglones separados (antes compartían uno de altura
			     fija y ambos se truncaban); el contacto pasa a otro renglón si no cabe. -->
			<div
				v-if="selectedCustomer && !changing"
				class="flex items-center min-h-[2.375rem] bg-surface border border-border rounded-md"
			>
				<button
					:id="$attrs.id"
					type="button"
					class="flex-1 min-w-0 flex flex-col justify-center gap-0.5 self-stretch px-3 py-1.5 text-left rounded-l-md hover:bg-bg transition-colors cursor-pointer"
					title="Cambiar cliente"
					@click="startSearch"
				>
					<span class="text-sm font-medium text-text truncate max-w-full">{{ selectedCustomer.name }}</span>
					<span
						v-if="selectedCustomer.phone || selectedCustomer.email"
						class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-text-muted max-w-full"
					>
						<span v-if="selectedCustomer.phone" class="inline-flex items-center gap-1">
							<i class="ti ti-phone" aria-hidden="true"></i>
							{{ selectedCustomer.phone }}
						</span>
						<span v-if="selectedCustomer.email" class="inline-flex items-center gap-1 min-w-0 max-w-full">
							<i class="ti ti-mail shrink-0" aria-hidden="true"></i>
							<span class="truncate">{{ selectedCustomer.email }}</span>
						</span>
					</span>
				</button>
				<button
					type="button"
					class="shrink-0 flex items-center p-1.5 mx-1 rounded text-text-muted hover:bg-bg hover:text-text transition-colors cursor-pointer"
					aria-label="Quitar cliente"
					title="Quitar cliente"
					@click="clearSelection"
				>
					<i class="ti ti-x text-sm"></i>
				</button>
			</div>

			<template v-else>
				<i
					class="ti ti-search absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none"
				></i>
				<InputTextCustom
					v-bind="$attrs"
					v-model="searchQuery"
					role="combobox"
					autocomplete="off"
					aria-autocomplete="list"
					:aria-expanded="dropdownOpen"
					:aria-controls="listboxId"
					:aria-activedescendant="dropdownOpen && results[activeIndex] ? optionId(activeIndex) : undefined"
					:placeholder="loading ? 'Cargando clientes…' : 'Buscar por nombre, teléfono o correo…'"
					:disabled="loading"
					class="pl-8"
					@focus="openDropdown"
					@input="openDropdown"
					@blur="closeDropdownDelayed"
					@keydown="onKeydown"
				/>

				<div
					v-if="dropdownOpen"
					class="absolute z-10 mt-1 w-full bg-surface border border-border rounded-md overflow-hidden"
				>
					<ul v-if="results.length > 0" :id="listboxId" ref="listbox" role="listbox" class="max-h-64 overflow-y-auto">
						<li
							v-for="(customer, index) in results"
							:id="optionId(index)"
							:key="customer.id"
							role="option"
							:aria-selected="index === activeIndex"
							class="px-3 py-2 cursor-pointer border-b border-border last:border-b-0 transition-colors"
							:class="index === activeIndex ? 'bg-bg' : ''"
							@mousedown.prevent="selectCustomer(customer)"
							@mousemove="activeIndex = index"
						>
							<p class="text-sm text-text">{{ customer.name }}</p>
							<p v-if="contactLine(customer)" class="text-xs text-text-muted mt-0.5">
								{{ contactLine(customer) }}
							</p>
						</li>
					</ul>

					<div v-else class="px-3 py-2 text-xs text-text-muted">
						Sin resultados.
						<button
							v-if="searchQuery.trim()"
							type="button"
							class="text-accent hover:underline cursor-pointer"
							@mousedown.prevent="openCreateDialog"
						>
							Registrar "{{ searchQuery.trim() }}" como cliente nuevo
						</button>
					</div>

					<p
						v-if="hiddenCount > 0"
						class="px-3 py-1.5 text-xs text-text-muted bg-bg border-t border-border"
					>
						{{ hiddenCount }} más — escribe para filtrar.
					</p>
				</div>
			</template>
		</div>

		<button
			type="button"
			class="shrink-0 inline-flex items-center justify-center h-[2.375rem] w-[2.375rem] bg-surface border border-border hover:bg-bg text-text-muted hover:text-accent rounded-md transition-colors cursor-pointer"
			aria-label="Registrar cliente nuevo"
			title="Registrar cliente nuevo"
			@click="openCreateDialog"
		>
			<i class="ti ti-plus text-base"></i>
		</button>
	</div>

	<CustomerCreateDialog
		v-model:visible="createDialogOpen"
		:initial-name="createDialogName"
		@created="onCustomerCreated"
	/>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, useAttrs, useId, useTemplateRef } from 'vue'
import axios from '@/lib/axios'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'
import CustomerCreateDialog from '@/views/customers/components/CustomerCreateDialog.vue'

// El `id` (para el <label for>) y demás atributos van al input de búsqueda —o,
// con un cliente ya elegido, al botón que muestra su nombre—, no al contenedor.
defineOptions({ inheritAttrs: false })

// '' = sin cliente.
const customerId = defineModel({ type: [String, Number], default: '' })

const attrs = useAttrs()

// GET /api/customers acepta ?search=, pero no pagina: se carga completo una
// sola vez y se filtra client-side (instantáneo, sin una petición por tecla).
// Si el catálogo llega a miles de clientes, conviene pasar a ?search= con debounce.
const customers = ref([])
const loading = ref(false)

onMounted(fetchCustomers)

async function fetchCustomers() {
	loading.value = true

	try {
		const { data } = await axios.get('/api/customers')
		customers.value = data.data
	} catch (err) {
		console.error(err)
	} finally {
		loading.value = false
	}
}

// Un cliente borrado (soft delete) no viene en el listado, pero una cotización
// en edición puede seguir apuntando a él: se muestra un placeholder quitable.
const selectedCustomer = computed(() => {
	if (customerId.value === '' || customerId.value === null) return null

	const found = customers.value.find((c) => String(c.id) === String(customerId.value))
	if (found) return found
	return loading.value ? { name: 'Cargando…' } : { name: 'Cliente no disponible' }
})

function contactLine(customer) {
	return [customer.phone, customer.email].filter(Boolean).join(' · ')
}

// --- Búsqueda ---

const searchQuery = ref('')
const dropdownOpen = ref(false)
// "Cambiar cliente": se busca sin soltar el actual; si se sale sin elegir otro,
// se vuelve a mostrar el que ya estaba.
const changing = ref(false)
const activeIndex = ref(0)

const listboxId = useId()
function optionId(index) {
	return `${listboxId}-option-${index}`
}

function normalize(str) {
	return (str ?? '')
		.toString()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
}

// `searchText` se arma una vez por cliente. El teléfono se compara solo por
// dígitos para que "8112" encuentre "81 1234 5678".
const searchableCustomers = computed(() =>
	customers.value.map((customer) => ({
		customer,
		name: normalize(customer.name),
		searchText: normalize(`${customer.name} ${customer.email ?? ''}`),
		phoneDigits: (customer.phone ?? '').replace(/\D/g, ''),
	}))
)

const MAX_RESULTS = 8

const matches = computed(() => {
	const q = normalize(searchQuery.value).trim()
	if (!q) return searchableCustomers.value

	const isPhoneQuery = /^[\d\s()+-]+$/.test(q)
	const qDigits = q.replace(/\D/g, '')

	return searchableCustomers.value
		.filter(
			(entry) => entry.searchText.includes(q) || (isPhoneQuery && qDigits && entry.phoneDigits.includes(qDigits))
		)
		.sort((a, b) => Number(b.name.startsWith(q)) - Number(a.name.startsWith(q)))
})

const results = computed(() => matches.value.slice(0, MAX_RESULTS).map((entry) => entry.customer))
const hiddenCount = computed(() => Math.max(0, matches.value.length - MAX_RESULTS))

function openDropdown() {
	dropdownOpen.value = true
	activeIndex.value = 0
}

// Delay para que el mousedown en una opción alcance a registrarse antes del blur
// (mismo criterio que ProductAutocomplete).
function closeDropdownDelayed() {
	setTimeout(() => {
		dropdownOpen.value = false
		changing.value = false
		searchQuery.value = ''
	}, 150)
}

// La lista tiene scroll propio (max-h-64): la opción activa se mantiene visible
// al moverse con flechas (mismo criterio que ProductAutocomplete).
const listbox = useTemplateRef('listbox')
async function moveActive(index) {
	activeIndex.value = index
	await nextTick()
	listbox.value?.querySelector(`#${CSS.escape(optionId(index))}`)?.scrollIntoView({ block: 'nearest' })
}

function onKeydown(event) {
	if (event.key === 'ArrowDown') {
		event.preventDefault()
		if (!dropdownOpen.value) return openDropdown()
		moveActive(Math.max(0, Math.min(activeIndex.value + 1, results.value.length - 1)))
	} else if (event.key === 'ArrowUp') {
		event.preventDefault()
		moveActive(Math.max(activeIndex.value - 1, 0))
	} else if (event.key === 'Enter') {
		// Nunca envía el form de la cotización/venta desde el buscador.
		event.preventDefault()
		const customer = dropdownOpen.value && results.value[activeIndex.value]
		if (customer) selectCustomer(customer)
	} else if (event.key === 'Escape') {
		dropdownOpen.value = false
		if (changing.value) {
			changing.value = false
			searchQuery.value = ''
		}
	}
}

function selectCustomer(customer) {
	customerId.value = customer.id
	searchQuery.value = ''
	dropdownOpen.value = false
	changing.value = false
}

// Al volver al modo búsqueda se enfoca el input (que hereda el mismo `id`).
async function focusSearch() {
	await nextTick()
	if (attrs.id) document.getElementById(attrs.id)?.focus()
}

function startSearch() {
	changing.value = true
	focusSearch()
}

function clearSelection() {
	customerId.value = ''
	focusSearch()
}

// --- Alta rápida ---

const createDialogOpen = ref(false)
const createDialogName = ref('')

function openCreateDialog() {
	createDialogName.value = searchQuery.value.trim()
	dropdownOpen.value = false
	createDialogOpen.value = true
}

// Se inserta en su posición alfabética (mismo orden que el backend) y queda
// seleccionado, sin recargar el catálogo.
function onCustomerCreated(customer) {
	const index = customers.value.findIndex(
		(c) => c.name.localeCompare(customer.name, 'es', { sensitivity: 'base' }) > 0
	)
	if (index === -1) customers.value.push(customer)
	else customers.value.splice(index, 0, customer)

	selectCustomer(customer)
}
</script>
