import HomeView from '@/views/dashboard/HomeView.vue'

export default [
	{
		path: '/',
		name: 'home',
		component: HomeView,
		meta: { layout: 'AppLayout', section: 'dashboard', title: 'Dashboard', requiresAuth: true },
	},
	{
		path: '/dashboard',
		name: 'dashboard',
		component: HomeView,
		meta: { layout: 'AppLayout', section: 'dashboard', title: 'Dashboard', requiresAuth: true },
	},
]
