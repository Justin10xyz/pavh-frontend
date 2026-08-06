export default [
	{
		path: '/cotizaciones',
		name: 'cotizaciones',
		component: () => import('@/views/cotizaciones/CotizacionesView.vue'),
		meta: { layout: 'AppLayout', title: 'Cotizaciones', requiresAuth: true },
	},
]
