import { defineStore } from 'pinia'
import api from '@/lib/axios'

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
				this.error = err.response?.data?.message || 'No se pudo iniciar sesión.'
				throw err
			} finally {
				this.loading = false
			}
		},
		async logout() {
			this.loading = true
			try {
				await api.post('/api/logout')
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
