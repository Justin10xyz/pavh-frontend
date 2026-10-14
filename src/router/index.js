import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import authRoutes from './auth/auth.routes.js'
import dashboardRoutes from './dashboard/dashboard.routes.js'
import inventoryRoutes from './inventory/inventory.routes.js'
import quotesRoutes from './quotes/quotes.routes.js'
import posRoutes from './pos/pos.routes.js'
import customersRoutes from './customers/customers.routes.js'
import settingsRoutes from './settings/settings.routes.js'

const routes = [
	...authRoutes,
	...dashboardRoutes,
	...inventoryRoutes,
	...quotesRoutes,
	...posRoutes,
	...customersRoutes,
	...settingsRoutes,
]

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
})

router.beforeEach(async (to) => {
	if (!to.meta.requiresAuth && !to.meta.guestOnly) return true

	const auth = useAuthStore()

	// Reloading the page loses in-memory state: hydrate the session
	// against /api/user before deciding whether the route requires login.
	if (!auth.initialized) {
		await auth.fetchUser()
	}

	// An active session has nothing to do on the login screen.
	if (to.meta.guestOnly) {
		return auth.isAuthenticated ? { name: 'dashboard' } : true
	}

	// Remember the requested route so login can return to it.
	if (!auth.isAuthenticated) {
		return { name: 'login', query: { redirect: to.fullPath } }
	}

	return true
})

// Título de la pestaña por ruta, para distinguir varias pestañas abiertas
// (ej. una cotización y una venta). `index.html` deja "INNOVA" de respaldo.
router.afterEach((to) => {
	document.title = to.meta.title ? `${to.meta.title} · INNOVA` : 'INNOVA'
})

export default router
