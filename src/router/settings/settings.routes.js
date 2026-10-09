export default [
	{
		path: '/configuracion',
		name: 'configuracion.index',
		component: () => import('@/views/settings/ConfiguracionView.vue'),
		meta: { layout: 'AppLayout', title: 'Configuración', requiresAuth: true },
	},
	{
		path: '/configuracion/categorias',
		name: 'configuracion.categories',
		component: () => import('@/views/settings/CategoriesSettingsView.vue'),
		meta: { layout: 'AppLayout', title: 'Categorías de producto', requiresAuth: true },
	},
]
