export default [
	{
		path: '/cotizaciones',
		name: 'quotes',
		component: () => import('@/views/quotes/QuotesView.vue'),
		meta: { layout: 'AppLayout', title: 'Cotizaciones', requiresAuth: true },
	},
	{
		path: '/cotizaciones/nueva',
		name: 'quotes.create',
		component: () => import('@/views/quotes/QuoteFormView.vue'),
		meta: { layout: 'AppLayout', title: 'Nueva cotización', requiresAuth: true },
	},
	{
		path: '/cotizaciones/:id',
		name: 'quotes.show',
		component: () => import('@/views/quotes/QuoteDetailView.vue'),
		meta: { layout: 'AppLayout', title: 'Cotización', requiresAuth: true },
	},
]
