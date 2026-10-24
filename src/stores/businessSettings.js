import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/lib/axios'

// Datos del negocio: registro único en el backend (sin id en la ruta, siempre
// existe), por eso `settings` es un objeto y no un arreglo.
export const useBusinessSettingsStore = defineStore('businessSettings', () => {
    const settings = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const initialized = ref(false)

    async function fetchBusinessSettings() {
        if (initialized.value) return

        loading.value = true
        error.value = null

        try {
            const { data } = await axios.get('/api/business-settings')
            settings.value = data.data
            initialized.value = true
        } catch (err) {
            error.value = 'No se pudieron cargar los datos del negocio.'
            console.error(err)
        } finally {
            loading.value = false
        }
    }

    // Actualiza en su lugar con la respuesta, así quien ya lee `settings` ve
    // los datos guardados sin refetch. El error lo maneja la vista (422 inline).
    async function updateBusinessSettings(payload) {
        const { data } = await axios.put('/api/business-settings', payload)

        if (settings.value) Object.assign(settings.value, data.data)
        else settings.value = data.data

        return settings.value
    }

    return {
        settings,
        loading,
        error,
        initialized,
        fetchBusinessSettings,
        updateBusinessSettings,
    }
})
