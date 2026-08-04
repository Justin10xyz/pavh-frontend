import { defineStore } from 'pinia'
import api from '@/lib/axios'

export const useAuthStore = defineStore('auth', {
	state: () => ({
		user: null,
	}),
	getters: {
		isAuthenticated: (state) => !!state.user,
	},
	actions: {
		async getCsrfCookie() {
			await api.get('/sanctum/csrf-cookie')
		},
		async login(credentials) {
			await this.getCsrfCookie()
			await api.post('/login', credentials)
			await this.fetchUser()
		},
		async fetchUser() {
			const { data } = await api.get('/api/user')
			this.user = data
		},
		async logout() {
			await api.post('/logout')
			this.user = null
		},
	},
})