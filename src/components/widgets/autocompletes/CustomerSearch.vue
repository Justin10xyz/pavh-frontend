<template>
	<div class="flex items-center gap-2">
		<SelectCustom
			v-bind="$attrs"
			v-model="customerId"
			:options="customers"
			:loading="loading"
			placeholder="Sin cliente"
			allow-empty
			class="flex-1 min-w-0"
		/>
		<button
			type="button"
			class="shrink-0 inline-flex items-center justify-center h-[2.375rem] w-[2.375rem] bg-surface border border-border hover:bg-bg text-text-muted hover:text-accent rounded-md transition-colors cursor-pointer"
			aria-label="Registrar cliente nuevo"
			title="Registrar cliente nuevo"
			@click="createDialogOpen = true"
		>
			<i class="ti ti-plus text-base"></i>
		</button>
	</div>

	<CustomerCreateDialog v-model:visible="createDialogOpen" @created="onCustomerCreated" />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from '@/lib/axios'
import SelectCustom from '@/components/widgets/SelectCustom.vue'
import CustomerCreateDialog from '@/views/customers/components/CustomerCreateDialog.vue'

// El `id` (para el <label for>) y demás atributos van al SelectCustom, no al
// contenedor que lo agrupa con el botón de alta.
defineOptions({ inheritAttrs: false })

// '' = sin cliente.
const customerId = defineModel({ type: [String, Number], default: '' })

// GET /api/customers acepta ?search=, pero para un catálogo de este tamaño se
// carga completo una sola vez y se elige desde SelectCustom.
const customers = ref([])
const loading = ref(false)

const createDialogOpen = ref(false)

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

// Se inserta en su posición alfabética (mismo orden que el backend) y queda
// seleccionado, sin recargar el catálogo.
function onCustomerCreated(customer) {
	const index = customers.value.findIndex(
		(c) => c.name.localeCompare(customer.name, 'es', { sensitivity: 'base' }) > 0
	)
	if (index === -1) customers.value.push(customer)
	else customers.value.splice(index, 0, customer)

	customerId.value = customer.id
}
</script>
