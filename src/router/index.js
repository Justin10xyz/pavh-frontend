import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import authRoutes from './auth/auth.routes.js'
import dashboardRoutes from './dashboard/dashboard.routes.js'
import inventoryRoutes from './inventory/inventory.routes.js'
import quotesRoutes from './quotes/quotes.routes.js'
import posRoutes from './pos/pos.routes.js'
import customersRoutes from './customers/customers.routes.js'
import settingsRoutes from './settings/settings.routes.js'
import NotFoundView from '@/views/errors/NotFoundView.vue'

const routes = [
    ...authRoutes,
    ...dashboardRoutes,
    ...inventoryRoutes,
    ...quotesRoutes,
    ...posRoutes,
    ...customersRoutes,
    ...settingsRoutes,
    // Catch-all: debe ir al final. requiresAuth para que una ruta inexistente
    // sin sesión mande al login en vez de mostrar el 404.
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: NotFoundView,
        meta: { layout: 'AppLayout', title: 'Página no encontrada', requiresAuth: true },
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

router.beforeEach(async (to) => {
    // to.matched vacío = ningún route record coincidió y meta llega vacío.
    // Respaldo por si el catch-all falta o se reordena: nunca saltarse la sesión.
    const isUnmatched = to.matched.length === 0

    if (!isUnmatched && !to.meta.requiresAuth && !to.meta.guestOnly) return true

    const auth = useAuthStore()

    // Reloading the page loses in-memory state: hydrate the session
    // against /api/user before deciding whether the route requires login.
    if (!auth.initialized) {
        await auth.fetchUser()
    }

    // Sin sesión, ni siquiera revelamos que la ruta no existe: al login.
    // Con sesión, se resuelve como 404 normal.
    if (isUnmatched) {
        return auth.isAuthenticated ? true : { name: 'login', query: { redirect: to.fullPath } }
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
