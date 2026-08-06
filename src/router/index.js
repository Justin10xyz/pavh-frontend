import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: '/',
			name: 'home',
			component: HomeView,
			meta: { layout: 'AppLayout', requiresAuth: true },
		},
		{
			path: '/dashboard',
			name: 'dashboard',
			component: HomeView,
			meta: { layout: 'AppLayout', requiresAuth: true },
		},
		{
			path: '/about',
			name: 'about',
			// route level code-splitting
			// this generates a separate chunk (About.[hash].js) for this route
			// which is lazy-loaded when the route is visited.
			component: () => import('../views/AboutView.vue'),
			meta: { layout: 'AppLayout', requiresAuth: true },
		},
		{
			path: '/login',
			name: 'login',
			component: () => import('../views/login/Login.vue'),
			meta: { layout: 'AuthLayout' },
		},
	],
})

router.beforeEach(async (to) => {
	if (!to.meta.requiresAuth) return true

	const auth = useAuthStore()

	// Al recargar la página se pierde el estado en memoria: hidrata la sesión
	// contra /api/user antes de decidir si la ruta requiere login.
	if (!auth.initialized) {
		await auth.fetchUser()
	}

	if (!auth.isAuthenticated) {
		return { name: 'login' }
	}

	return true
})

export default router
