export default [
	{
		path: '/clientes',
		name: 'customers',
		component: () => import('@/views/customers/CustomersView.vue'),
		meta: { layout: 'AppLayout', title: 'Clientes', requiresAuth: true },
	},
]
