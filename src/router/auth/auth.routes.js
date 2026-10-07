export default [
	{
		path: '/login',
		name: 'login',
		component: () => import('@/views/login/Login.vue'),
		meta: { layout: 'AuthLayout', title: 'Iniciar sesión', requiresAuth: false },
	},
]
