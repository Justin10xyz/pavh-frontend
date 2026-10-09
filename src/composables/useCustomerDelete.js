import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import axios from '@/lib/axios'
import { useCustomersStore } from '@/stores/customers'

// Flujo de borrado compartido entre el listado y el detalle de clientes:
// GET delete-summary → ConfirmDialog con los conteos → customers.deleteCustomer().
// El resumen es solo informativo: el borrado nunca se bloquea por tener
// historial, y si el resumen falla se confirma igual con un texto genérico.
// Cada vista monta su propio <ConfirmDialog> y decide qué hacer al terminar
// (`onDeleted`).
export function useCustomerDelete({ onDeleted } = {}) {
	const confirm = useConfirm()
	const customers = useCustomersStore()

	// id del cliente en proceso (pidiendo resumen o borrando), para deshabilitar
	// su botón y no abrir dos confirmaciones.
	const busyId = ref(null)
	const deleteError = ref(null)

	async function requestDelete(customer) {
		if (busyId.value) return

		busyId.value = customer.id
		deleteError.value = null

		let summary = null
		try {
			const { data } = await axios.get(`/api/customers/${customer.id}/delete-summary`)
			summary = data.data
		} catch (err) {
			console.error(err)
		} finally {
			busyId.value = null
		}

		confirm.require({
			header: 'Eliminar cliente',
			message: buildMessage(customer.name, summary),
			accept: () => deleteCustomer(customer),
		})
	}

	async function deleteCustomer(customer) {
		busyId.value = customer.id

		try {
			await customers.deleteCustomer(customer.id)
			onDeleted?.(customer)
		} catch (err) {
			console.error(err)
			deleteError.value = err.response?.status === 404
				? 'El cliente ya no existe.'
				: 'No se pudo eliminar el cliente. Intenta de nuevo.'
		} finally {
			busyId.value = null
		}
	}

	return { busyId, deleteError, requestDelete }
}

function plural(count, singular, pluralForm) {
	return `${count} ${count === 1 ? singular : pluralForm}`
}

function buildMessage(name, summary) {
	const question = `¿Seguro que quieres eliminar a "${name}"? Esta acción no se puede deshacer.`

	if (!summary) {
		return `No se pudo consultar el historial de este cliente. ${question}`
	}

	const parts = []
	if (summary.quotes_count > 0) parts.push(plural(summary.quotes_count, 'cotización', 'cotizaciones'))
	if (summary.sales_count > 0) parts.push(plural(summary.sales_count, 'venta', 'ventas'))

	if (parts.length === 0) return question

	const total = summary.quotes_count + summary.sales_count
	return `Este cliente tiene ${parts.join(' y ')} ${total === 1 ? 'asociada' : 'asociadas'}. ${question}`
}
