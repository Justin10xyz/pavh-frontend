export default [
	{
		path: '/cotizaciones',
		name: 'quotes',
		component: () => import('@/views/quotes/QuotesView.vue'),
		meta: { layout: 'AppLayout', section: 'quotes', title: 'Cotizaciones', requiresAuth: true },
	},
	{
		path: '/cotizaciones/nueva',
		name: 'quotes.create',
		component: () => import('@/views/quotes/QuoteFormView.vue'),
		meta: { layout: 'AppLayout', section: 'quotes', title: 'Nueva cotización', requiresAuth: true },
	},
	{
		path: '/cotizaciones/:id/editar',
		name: 'quotes.edit',
		component: () => import('@/views/quotes/QuoteFormView.vue'),
		meta: { layout: 'AppLayout', section: 'quotes', title: 'Editar cotización', requiresAuth: true },
	},
	{
		path: '/cotizaciones/:id',
		name: 'quotes.show',
		component: () => import('@/views/quotes/QuoteDetailView.vue'),
		meta: { layout: 'AppLayout', section: 'quotes', title: 'Cotización', requiresAuth: true },
	},
]
