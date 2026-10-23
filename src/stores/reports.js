import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/lib/axios'

export const useReportsStore = defineStore('reports', () => {
    const items = ref([])
    const summary = ref(null)
    const loading = ref(false)
    const error = ref(null)
    // Sin flag `initialized`: igual que sales, cada periodo es una consulta
    // distinta y siempre debe ir al backend.

    // Si el usuario cambia de mes antes de que responda la consulta anterior,
    // solo la respuesta más reciente puede escribir en el estado.
    let lastRequestId = 0

    // La respuesta no va envuelta en `data`: { items, summary }.
    async function fetchComprobanteReport({ from, to }) {
        const requestId = ++lastRequestId
        loading.value = true
        error.value = null

        try {
            const { data } = await axios.get('/api/reports/comprobantes', { params: { from, to } })
            if (requestId !== lastRequestId) return
            items.value = data.items
            summary.value = data.summary
        } catch (err) {
            if (requestId !== lastRequestId) return
            error.value = 'No se pudo cargar el reporte.'
            console.error(err)
        } finally {
            if (requestId === lastRequestId) loading.value = false
        }
    }

    // Devuelven el archivo como Blob; descargarlo lo decide la vista (mismo
    // criterio que fetchSalePdf).
    async function fetchComprobanteReportPdf({ from, to }) {
        const { data } = await axios.get('/api/reports/comprobantes/pdf', {
            params: { from, to },
            responseType: 'blob',
        })
        return data
    }

    async function fetchComprobanteReportCsv({ from, to }) {
        const { data } = await axios.get('/api/reports/comprobantes/csv', {
            params: { from, to },
            responseType: 'blob',
        })
        return data
    }

    return {
        items,
        summary,
        loading,
        error,
        fetchComprobanteReport,
        fetchComprobanteReportPdf,
        fetchComprobanteReportCsv,
    }
})
