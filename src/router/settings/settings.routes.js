export default [
    {
        path: '/configuracion',
        name: 'settings.index',
        component: () => import('@/views/settings/SettingsView.vue'),
        meta: { layout: 'AppLayout', section: 'settings', title: 'Configuración', requiresAuth: true },
    },
    {
        path: '/configuracion/categorias',
        name: 'settings.categories',
        component: () => import('@/views/settings/CategoriesSettingsView.vue'),
        meta: { layout: 'AppLayout', section: 'settings', title: 'Categorías de producto', requiresAuth: true },
    },
    {
        path: '/configuracion/proveedores',
        name: 'settings.suppliers',
        component: () => import('@/views/settings/SuppliersSettingsView.vue'),
        meta: { layout: 'AppLayout', section: 'settings', title: 'Proveedores', requiresAuth: true },
    },
    {
        path: '/configuracion/datos-negocio',
        name: 'settings.businessSettings',
        component: () => import('@/views/settings/BusinessSettingsView.vue'),
        meta: { layout: 'AppLayout', section: 'settings', title: 'Datos del negocio', requiresAuth: true },
    },
    {
        path: '/configuracion/estilos',
        name: 'settings.floorStyles',
        component: () => import('@/views/settings/FloorStylesSettingsView.vue'),
        meta: { layout: 'AppLayout', section: 'settings', title: 'Estilos de piso', requiresAuth: true },
    },
]
