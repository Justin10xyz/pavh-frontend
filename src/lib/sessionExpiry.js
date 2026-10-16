import api from '@/lib/axios'
import { useAuthStore } from '@/stores/auth'

// Peticiones de la propia sesión: cada una maneja su 401 (fetchUser lo toma
// como "sin sesión", logout cierra igual), así que el interceptor no las toca.
const AUTH_URLS = ['/sanctum/csrf-cookie', '/api/login', '/api/logout', '/api/user']

// Si la sesión vence a media operación, una petición protegida responde 401
// (GET) o 419 (POST/PUT/PATCH/DELETE: el token CSRF pertenecía a la sesión que
// ya no existe). Se cierra la sesión local y se manda al login con ?redirect=
// para volver a la misma pantalla. Se registra desde main.js, no en axios.js,
// para no crear un import circular axios → router → store → axios.
export function setupSessionExpiry(router) {
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            const status = error.response?.status
            const auth = useAuthStore()

            // `isAuthenticated` evita redirigir varias veces cuando una vista
            // dispara varias peticiones en paralelo y todas responden 401.
            if ((status === 401 || status === 419) && auth.isAuthenticated && !AUTH_URLS.includes(error.config?.url)) {
                auth.expireSession()
                router.replace({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
            }

            return Promise.reject(error)
        },
    )
}
