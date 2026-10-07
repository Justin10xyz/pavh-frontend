export default [
	{
		path: '/pos',
		name: 'pos',
		component: () => import('@/views/pos/PosView.vue'),
		meta: { layout: 'AppLayout', title: 'Punto de venta', requiresAuth: true },
	},
	{
		path: '/pos/venta-directa',
		name: 'pos.sales.create',
		component: () => import('@/views/pos/SaleFormView.vue'),
		meta: { layout: 'AppLayout', title: 'Venta directa', requiresAuth: true },
	},
]
