import { ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import axios from '@/lib/axios'
import { useInventoryStore } from '@/stores/inventory'
import { useNotify } from '@/composables/useNotify'

// Mismo flujo que useCustomerDelete.js, para pisos (no aplica a "Otros productos"):
// GET delete-summary → ConfirmDialog con los conteos → inventory.deleteProduct().
// El resumen es solo informativo: el borrado nunca se bloquea por tener
// historial, y si el resumen falla se confirma igual con un texto genérico.
// La vista monta su propio <ConfirmDialog> y decide qué hacer al terminar
// (`onDeleted`).
export function useProductDelete({ onDeleted } = {}) {
    const confirm = useConfirm()
    const inventory = useInventoryStore()
    const notify = useNotify()

    // id del producto en proceso (pidiendo resumen o borrando), para deshabilitar
    // su botón y no abrir dos confirmaciones.
    const busyId = ref(null)
    const deleteError = ref(null)

    async function requestDelete(product) {
        if (busyId.value) return

        busyId.value = product.id
        deleteError.value = null

        let summary = null
        try {
            const { data } = await axios.get(`/api/products/${product.id}/delete-summary`)
            summary = data.data
        } catch (err) {
            console.error(err)
        } finally {
            busyId.value = null
        }

        confirm.require({
            header: 'Eliminar producto',
            message: buildMessage(product.name, summary),
            accept: () => deleteProduct(product),
        })
    }

    async function deleteProduct(product) {
        busyId.value = product.id

        try {
            await inventory.deleteProduct(product.id)
            notify.success('Producto eliminado', product.name)
            onDeleted?.(product)
        } catch (err) {
            console.error(err)
            deleteError.value = err.response?.status === 404
                ? 'El producto ya no existe.'
                : 'No se pudo eliminar el producto. Intenta de nuevo.'
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
    const question = `¿Seguro que quieres eliminar "${name}" con todas sus medidas y colores? Esta acción no se puede deshacer.`

    if (!summary) {
        return `No se pudo consultar el historial de este producto. ${question}`
    }

    const parts = []
    if (summary.quotes_count > 0) parts.push(plural(summary.quotes_count, 'cotización', 'cotizaciones'))
    if (summary.sales_count > 0) parts.push(plural(summary.sales_count, 'venta', 'ventas'))

    if (parts.length === 0) return question

    // Las cotizaciones y ventas conservan el nombre del producto en su detalle.
    return `Este producto aparece en ${parts.join(' y ')}, que lo seguirán mostrando. ${question}`
}
