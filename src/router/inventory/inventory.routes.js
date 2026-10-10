export default [
	{
		path: '/inventario',
		name: 'inventory',
		component: () => import('@/views/inventory/InventoryView.vue'),
		meta: { layout: 'AppLayout', section: 'inventory', title: 'Inventario', requiresAuth: true },
	},
	{
		path: '/inventario/productos/nuevo',
		name: 'products.create',
		component: () => import('@/views/inventory/ProductFormView.vue'),
		meta: { layout: 'AppLayout', section: 'inventory', title: 'Nuevo producto', requiresAuth: true },
	},
	{
		path: '/inventario/productos/:id/editar',
		name: 'products.edit',
		component: () => import('@/views/inventory/ProductFormView.vue'),
		meta: { layout: 'AppLayout', section: 'inventory', title: 'Editar producto', requiresAuth: true },
	},
	{
		path: '/inventario/otros-productos/nuevo',
		name: 'inventory.simpleProducts.create',
		component: () => import('@/views/inventory/SimpleProductFormView.vue'),
		meta: { layout: 'AppLayout', section: 'inventory', title: 'Nuevo producto', requiresAuth: true },
	},
	{
		path: '/inventario/otros-productos/:id/editar',
		name: 'inventory.simpleProducts.edit',
		component: () => import('@/views/inventory/SimpleProductFormView.vue'),
		meta: { layout: 'AppLayout', section: 'inventory', title: 'Editar producto', requiresAuth: true },
	},
]
