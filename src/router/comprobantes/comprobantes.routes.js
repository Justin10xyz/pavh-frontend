export default [
    {
        path: '/comprobantes',
        name: 'comprobantes.index',
        component: () => import('@/views/comprobantes/ComprobantesView.vue'),
        meta: { layout: 'AppLayout', section: 'comprobantes', title: 'Comprobantes', requiresAuth: true },
    },
    {
        // Solo conversión desde una cotización pagada (?quote_id=).
        // Antes que /comprobantes/:id para que "nuevo" no se tome como un id.
        path: '/comprobantes/nuevo',
        name: 'comprobantes.create',
        component: () => import('@/views/comprobantes/ComprobanteFormView.vue'),
        meta: { layout: 'AppLayout', section: 'comprobantes', title: 'Nuevo comprobante', requiresAuth: true },
    },
    {
        path: '/comprobantes/:id',
        name: 'comprobantes.show',
        component: () => import('@/views/comprobantes/ComprobanteDetailView.vue'),
        meta: { layout: 'AppLayout', section: 'comprobantes', title: 'Comprobante', requiresAuth: true },
    },
]
