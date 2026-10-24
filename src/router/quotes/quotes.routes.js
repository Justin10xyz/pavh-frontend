export default [
    {
        path: '/cotizaciones',
        name: 'quotes',
        component: () => import('@/views/quotes/QuotesView.vue'),
        meta: { layout: 'AppLayout', section: 'quotes', title: 'Presupuestos', requiresAuth: true },
    },
    {
        path: '/cotizaciones/nueva',
        name: 'quotes.create',
        component: () => import('@/views/quotes/QuoteFormView.vue'),
        meta: { layout: 'AppLayout', section: 'quotes', title: 'Nuevo presupuesto', requiresAuth: true },
    },
    {
        path: '/cotizaciones/:id/editar',
        name: 'quotes.edit',
        component: () => import('@/views/quotes/QuoteFormView.vue'),
        meta: { layout: 'AppLayout', section: 'quotes', title: 'Editar presupuesto', requiresAuth: true },
    },
    {
        path: '/cotizaciones/:id',
        name: 'quotes.show',
        component: () => import('@/views/quotes/QuoteDetailView.vue'),
        meta: { layout: 'AppLayout', section: 'quotes', title: 'Presupuesto', requiresAuth: true },
    },
]
