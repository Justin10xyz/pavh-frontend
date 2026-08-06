export default [
	{
		path: '/pos',
		name: 'pos',
		component: () => import('@/views/pos/PosView.vue'),
		meta: { layout: 'AppLayout', title: 'Punto de venta', requiresAuth: true },
	},
]
