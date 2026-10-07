import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import authRoutes from './auth/auth.routes.js'
import dashboardRoutes from './dashboard/dashboard.routes.js'
import inventoryRoutes from './inventory/inventory.routes.js'
import quotesRoutes from './quotes/quotes.routes.js'
import posRoutes from './pos/pos.routes.js'

const routes = [
	...authRoutes,
	...dashboardRoutes,
	...inventoryRoutes,
	...quotesRoutes,
	...posRoutes,
]

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
})

router.beforeEach(async (to) => {
	if (!to.meta.requiresAuth) return true

	const auth = useAuthStore()

	// Reloading the page loses in-memory state: hydrate the session
	// against /api/user before deciding whether the route requires login.
	if (!auth.initialized) {
		await auth.fetchUser()
	}

	if (!auth.isAuthenticated) {
		return { name: 'login' }
	}

	return true
})

export default router
