export default [
	{
		path: '/clientes',
		name: 'customers',
		component: () => import('@/views/customers/CustomersView.vue'),
		meta: { layout: 'AppLayout', title: 'Clientes', requiresAuth: true },
	},
	{
		path: '/clientes/nuevo',
		name: 'customers.create',
		component: () => import('@/views/customers/CustomerFormView.vue'),
		meta: { layout: 'AppLayout', title: 'Nuevo cliente', requiresAuth: true },
	},
	{
		path: '/clientes/:id/editar',
		name: 'customers.edit',
		component: () => import('@/views/customers/CustomerFormView.vue'),
		meta: { layout: 'AppLayout', title: 'Editar cliente', requiresAuth: true },
	},
	{
		path: '/clientes/:id',
		name: 'customers.show',
		component: () => import('@/views/customers/CustomerDetailView.vue'),
		meta: { layout: 'AppLayout', title: 'Cliente', requiresAuth: true },
	},
]
