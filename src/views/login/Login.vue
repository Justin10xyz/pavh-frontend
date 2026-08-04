<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = reactive({
	email: '',
	password: '',
	rememberMe: false,
})

const errors = reactive({
	email: '',
	password: '',
})

const isLoading = ref(false)

const validateForm = () => {
	let isValid = true
	errors.email = ''
	errors.password = ''

	if (!form.email) {
		errors.email = 'El correo electrónico es requerido'
		isValid = false
	} else if (!/\S+@\S+\.\S+/.test(form.email)) {
		errors.email = 'El formato del correo electrónico no es válido'
		isValid = false
	}

	if (!form.password) {
		errors.password = 'La contraseña es requerida'
		isValid = false
	} else if (form.password.length < 6) {
		errors.password = 'La contraseña debe tener al menos 6 caracteres'
		isValid = false
	}

	return isValid
}

const handleSubmit = () => {
	if (!validateForm()) return

	isLoading.value = true
	// Simular retraso de llamada API
	setTimeout(() => {
		isLoading.value = false
		router.push('/')
	}, 1200)
}
</script>

<template>
	<div class="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden group">
		<!-- Borde superior brillante con gradiente -->
		<div class="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-violet-500 opacity-80"></div>
		
		<!-- Encabezado -->
		<div class="text-center mb-8">
			<div class="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
				<svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
				</svg>
			</div>
			<h2 class="text-2xl font-bold text-white tracking-tight">¡Bienvenido de nuevo!</h2>
			<p class="text-slate-400 text-sm mt-2">Ingresa tus credenciales para acceder a tu cuenta</p>
		</div>

		<!-- Formulario -->
		<form @submit.prevent="handleSubmit" class="space-y-5">
			<!-- Input de Correo -->
			<div class="space-y-1.5">
				<label for="email" class="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Correo Electrónico</label>
				<div class="relative">
					<span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
						</svg>
					</span>
					<input
						id="email"
						v-model="form.email"
						type="email"
						placeholder="ejemplo@correo.com"
						class="w-full bg-slate-950/50 border rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all duration-200"
						:class="[
							errors.email
								? 'border-rose-500/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10'
								: 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'
						]"
					/>
				</div>
				<p v-if="errors.email" class="text-rose-400 text-xs mt-1 flex items-center gap-1">
					<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
					</svg>
					{{ errors.email }}
				</p>
			</div>

			<!-- Input de Contraseña -->
			<div class="space-y-1.5">
				<label for="password" class="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Contraseña</label>
				<div class="relative">
					<span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</span>
					<input
						id="password"
						v-model="form.password"
						type="password"
						placeholder="••••••••"
						class="w-full bg-slate-950/50 border rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all duration-200"
						:class="[
							errors.password
								? 'border-rose-500/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10'
								: 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10'
						]"
					/>
				</div>
				<p v-if="errors.password" class="text-rose-400 text-xs mt-1 flex items-center gap-1">
					<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
					</svg>
					{{ errors.password }}
				</p>
			</div>

			<!-- Opciones adicionales -->
			<div class="flex items-center justify-between pt-1">
				<label class="flex items-center gap-2 cursor-pointer group">
					<input
						type="checkbox"
						v-model="form.rememberMe"
						class="rounded border-slate-850 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 focus:ring-2 cursor-pointer h-4 w-4"
					/>
					<span class="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Recordar contraseña</span>
				</label>
				<a href="#" class="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">¿Olvidaste tu contraseña?</a>
			</div>

			<!-- Botón de Envío -->
			<button
				type="submit"
				:disabled="isLoading"
				class="w-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:from-indigo-600/50 disabled:to-violet-700/50 text-white font-medium py-3 px-4 rounded-xl transition duration-200 shadow-lg shadow-indigo-500/10 active:scale-[0.98] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm cursor-pointer mt-6"
			>
				<svg v-if="isLoading" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				<span v-if="!isLoading">Iniciar Sesión</span>
				<span v-else>Iniciando sesión...</span>
			</button>
		</form>
	</div>
</template>