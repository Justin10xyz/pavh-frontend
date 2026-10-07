<template>
	<select
		v-model="customerId"
		:disabled="loading"
		class="w-full bg-surface border border-border text-sm text-text focus:outline-none focus:border-accent transition-colors px-3 h-[38px] rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
	>
		<option value="">{{ loading ? 'Cargando…' : 'Sin cliente' }}</option>
		<option v-for="customer in customers" :key="customer.id" :value="customer.id">{{ customer.name }}</option>
	</select>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from '@/lib/axios'

// '' = sin cliente; el `id` (para el <label for>) y demás atributos caen
// directo al <select> raíz.
const customerId = defineModel({ type: [String, Number], default: '' })

// GET /api/customers acepta ?search=, pero para un catálogo de este tamaño se
// carga completo una sola vez y se filtra en el <select> nativo del navegador.
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
</script>

<style scoped>

</style>
