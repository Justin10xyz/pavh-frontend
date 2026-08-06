import HomeView from '@/views/HomeView.vue'

export default [
	{
		path: '/',
		name: 'home',
		component: HomeView,
		meta: { layout: 'AppLayout', title: 'Dashboard', requiresAuth: true },
	},
	{
		path: '/dashboard',
		name: 'dashboard',
		component: HomeView,
		meta: { layout: 'AppLayout', title: 'Dashboard', requiresAuth: true },
	},
]
