<template>
	<SelectCustom
		v-model="customerId"
		:options="customers"
		:loading="loading"
		placeholder="Sin cliente"
		allow-empty
	/>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from '@/lib/axios'
import SelectCustom from '@/components/widgets/SelectCustom.vue'

// '' = sin cliente; el `id` (para el <label for>) y demás atributos caen
// hasta el <select> de SelectCustom.
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
