import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from '@/lib/axios'

export const useCatalogsStore = defineStore('catalogs', () => {
    const suppliers = ref([])
    const floorStyles = ref([])
    const categories = ref([])
    const unitTypes = ref([])
    const commissionCategories = ref([])
    const loading = ref(false)
    const error = ref(null)
    const initialized = ref(false)

    async function fetchCatalogs() {
        if (initialized.value) return

        loading.value = true
        error.value = null

        try {
            const [suppliersRes, floorStylesRes, categoriesRes, unitTypesRes, commissionCategoriesRes] = await Promise.all([
                axios.get('/api/suppliers'),
                axios.get('/api/floor-styles'),
                axios.get('/api/categories'),
                axios.get('/api/unit-types'),
                axios.get('/api/commission-categories'),
            ])

            suppliers.value = suppliersRes.data.data
            floorStyles.value = floorStylesRes.data.data
            categories.value = categoriesRes.data.data
            unitTypes.value = unitTypesRes.data.data
            commissionCategories.value = commissionCategoriesRes.data.data
            initialized.value = true
        } catch (err) {
            error.value = 'No se pudieron cargar los catálogos.'
            console.error(err)
        } finally {
            loading.value = false
        }
    }

    // Mutación puntual: agrega el proveedor recién creado sin refetch completo.
    // El backend lista proveedores por id, así que el nuevo va al final.
    function addSupplier(supplier) {
        suppliers.value.push(supplier)
    }

    // Mutación puntual: reemplaza en su lugar los datos del proveedor editado,
    // así los selects que ya lo muestran se actualizan sin refetch.
    function updateSupplier(id, payload) {
        const supplier = suppliers.value.find((s) => s.id === id)
        if (supplier) Object.assign(supplier, payload)
    }

    // Mutación puntual: quita el proveedor eliminado (soft delete en el backend).
    function removeSupplier(id) {
        suppliers.value = suppliers.value.filter((s) => s.id !== id)
    }

    // Mutación puntual: agrega el estilo de piso recién creado sin refetch completo.
    // El backend lista estilos por id, así que el nuevo va al final.
    function addFloorStyle(floorStyle) {
        floorStyles.value.push(floorStyle)
    }

    // Mutación puntual: reemplaza en su lugar los datos del estilo editado,
    // así los selects que ya lo muestran se actualizan sin refetch.
    function updateFloorStyle(id, payload) {
        const floorStyle = floorStyles.value.find((f) => f.id === id)
        if (floorStyle) Object.assign(floorStyle, payload)
    }

    // Mutación puntual: quita el estilo eliminado (soft delete en el backend).
    function removeFloorStyle(id) {
        floorStyles.value = floorStyles.value.filter((f) => f.id !== id)
    }

    // Mutación puntual: agrega la categoría recién creada sin refetch completo.
    // El backend lista categorías por id, así que la nueva va al final.
    function addCategory(category) {
        categories.value.push(category)
    }

    // Mutación puntual: reemplaza en su lugar los datos de la categoría editada,
    // así los selects que ya la muestran se actualizan sin refetch.
    function updateCategory(id, payload) {
        const category = categories.value.find((c) => c.id === id)
        if (category) Object.assign(category, payload)
    }

    // Mutación puntual: quita la categoría eliminada (soft delete en el backend).
    function removeCategory(id) {
        categories.value = categories.value.filter((c) => c.id !== id)
    }

    return {
        suppliers,
        floorStyles,
        categories,
        unitTypes,
        commissionCategories,
        loading,
        error,
        initialized,
        fetchCatalogs,
        addSupplier,
        updateSupplier,
        removeSupplier,
        addFloorStyle,
        updateFloorStyle,
        removeFloorStyle,
        addCategory,
        updateCategory,
        removeCategory,
    }
})
