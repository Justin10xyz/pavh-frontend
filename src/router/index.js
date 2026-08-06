import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import authRoutes from './auth/auth.routes.js'
import dashboardRoutes from './dashboard/dashboard.routes.js'
import inventarioRoutes from './inventario/inventario.routes.js'
import cotizacionesRoutes from './cotizaciones/cotizaciones.routes.js'
import posRoutes from './pos/pos.routes.js'

const routes = [
	...authRoutes,
	...dashboardRoutes,
	...inventarioRoutes,
	...cotizacionesRoutes,
	...posRoutes,
]

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes,
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
