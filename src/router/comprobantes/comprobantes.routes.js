export default [
    {
        // Solo conversión desde una cotización pagada (?quote_id=). Sin listado
        // propio todavía: la sección resaltada en el sidebar es Cotizaciones.
        path: '/comprobantes/nuevo',
        name: 'comprobantes.create',
        component: () => import('@/views/comprobantes/ComprobanteFormView.vue'),
        meta: { layout: 'AppLayout', section: 'quotes', title: 'Nuevo comprobante', requiresAuth: true },
    },
]
