export default [
	{
		path: '/inventario',
		name: 'inventory',
		component: () => import('@/views/inventory/InventoryView.vue'),
		meta: { layout: 'AppLayout', title: 'Inventario', requiresAuth: true },
	},
]
