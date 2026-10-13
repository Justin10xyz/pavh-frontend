import { defineStore } from 'pinia'
import api from '@/lib/axios'

// Mensaje del error de login según el status. El texto del backend solo se usa
// en 422 ("Credenciales inválidas.") y 429 (con los segundos de espera), que el
// backend arma en español; los demás llegan en inglés o son técnicos
// ("CSRF token mismatch.", "Server Error").
function loginErrorMessage(err) {
	const status = err.response?.status
	if (!err.response) return 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.'
	if (status === 422) return err.response.data?.message || 'Credenciales inválidas.'
	if (status === 429) return err.response.data?.message || 'Demasiados intentos. Espera un minuto e intenta de nuevo.'
	if (status === 419) return 'La página expiró. Intenta de nuevo.'
	return 'No se pudo iniciar sesión. Intenta de nuevo en unos momentos.'
}

export const useAuthStore = defineStore('auth', {
	state: () => ({
		user: null,
		isAuthenticated: false,
		loading: false,
		error: null,
		// Evita repetir fetchUser() en cada navegación del guard tras la hidratación inicial.
		initialized: false,
	}),
	actions: {
		async login(email, password) {
			this.loading = true
			this.error = null
			try {
				await api.get('/sanctum/csrf-cookie')
				await api.post('/api/login', { email, password })
				await this.fetchUser()
			} catch (err) {
				this.user = null
				this.isAuthenticated = false
				this.error = loginErrorMessage(err)
				throw err
			} finally {
				this.loading = false
			}

			// fetchUser() no lanza: si /api/user falla tras un login aceptado (ej. la
			// cookie de sesión no llegó por configuración de dominio en Sanctum), sin
			// este chequeo la vista navegaría y el guard la regresaría al login sin aviso.
			if (!this.isAuthenticated) {
				this.error = 'Se validaron tus credenciales, pero no se pudo abrir la sesión. Intenta de nuevo.'
				throw new Error(this.error)
			}
		},
		// Sesión vencida a media operación (ver src/lib/sessionExpiry.js): limpia
		// el estado local y deja el aviso que Login.vue muestra junto al botón.
		expireSession() {
			this.user = null
			this.isAuthenticated = false
			this.error = 'Tu sesión expiró. Inicia sesión de nuevo para continuar.'
		},
		async logout() {
			this.loading = true
			try {
				await api.post('/api/logout')
			} catch {
				// La sesión pudo vencer en el servidor (401): localmente se cierra igual,
				// para no dejar al usuario dentro de la app sin sesión.
			} finally {
				this.user = null
				this.isAuthenticated = false
				this.loading = false
			}
		},
		async fetchUser() {
			this.loading = true
			try {
				const { data } = await api.get('/api/user')
				this.user = data
				this.isAuthenticated = true
			} catch {
				this.user = null
				this.isAuthenticated = false
			} finally {
				this.loading = false
				this.initialized = true
			}
		},
	},
})
