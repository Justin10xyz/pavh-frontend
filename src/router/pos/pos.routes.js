export default [
	{
		path: '/pos',
		name: 'pos',
		component: () => import('@/views/pos/PosView.vue'),
		meta: { layout: 'AppLayout', section: 'pos', title: 'Punto de venta', requiresAuth: true },
	},
	{
		path: '/pos/venta-directa',
		name: 'pos.sales.create',
		component: () => import('@/views/pos/SaleFormView.vue'),
		meta: { layout: 'AppLayout', section: 'pos', title: 'Venta directa', requiresAuth: true },
	},
	{
		path: '/pos/ventas',
		name: 'pos.sales.index',
		component: () => import('@/views/pos/SalesView.vue'),
		meta: { layout: 'AppLayout', section: 'pos', title: 'Ventas', requiresAuth: true },
	},
	{
		path: '/pos/ventas/:id',
		name: 'pos.sales.show',
		component: () => import('@/views/pos/SaleDetailView.vue'),
		meta: { layout: 'AppLayout', section: 'pos', title: 'Venta', requiresAuth: true },
	},
]
