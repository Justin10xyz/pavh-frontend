export default [
	{
		path: '/inventario',
		name: 'inventario',
		component: () => import('@/views/inventario/InventarioView.vue'),
		meta: { layout: 'AppLayout', title: 'Inventario', requiresAuth: true },
	},
]
