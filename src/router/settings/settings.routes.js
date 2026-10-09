export default [
	{
		path: '/configuracion',
		name: 'settings.index',
		component: () => import('@/views/settings/SettingsView.vue'),
		meta: { layout: 'AppLayout', title: 'Configuración', requiresAuth: true },
	},
	{
		path: '/configuracion/categorias',
		name: 'settings.categories',
		component: () => import('@/views/settings/CategoriesSettingsView.vue'),
		meta: { layout: 'AppLayout', title: 'Categorías de producto', requiresAuth: true },
	},
]
