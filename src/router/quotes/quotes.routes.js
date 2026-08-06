export default [
	{
		path: '/cotizaciones',
		name: 'quotes',
		component: () => import('@/views/quotes/QuotesView.vue'),
		meta: { layout: 'AppLayout', title: 'Cotizaciones', requiresAuth: true },
	},
]
