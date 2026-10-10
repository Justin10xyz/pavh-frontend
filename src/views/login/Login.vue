<template>
	<div class="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm relative">
		<!-- Header with logo placeholder and title -->
		<div class="flex flex-col items-center mb-6">
			<!-- Logo placeholder (48x48px, rounded corner) -->
			<div class="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-[15px] font-bold text-zinc-800 select-none mb-4">
				PV
			</div>
			<!-- Hierarchy: title 22px/500, subtitle 13px gray -->
			<h2 class="text-[22px] font-medium text-zinc-900 tracking-tight leading-7 text-center">¡Bienvenido de nuevo!</h2>
			<p class="text-[13px] text-zinc-500 mt-1.5 text-center">Ingresa tus credenciales para acceder al sistema</p>
		</div>

		<!-- General server error (invalid credentials, etc.) -->
		<p v-if="auth.error" class="text-red-600 text-[12px] mb-4 flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
			<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			{{ auth.error }}
		</p>

		<!-- Form -->
		<form @submit.prevent="handleSubmit" class="space-y-4">
			<!-- Email input -->
			<div class="space-y-1.5">
				<label for="email" class="text-xs font-medium text-zinc-650 block">Correo Electrónico</label>
				<div class="relative">
					<span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
						<!-- Envelope icon on the left -->
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
					</span>
					<input
						id="email"
						v-model="form.email"
						type="email"
						placeholder="ejemplo@correo.com"
						@input="errors.email = ''; auth.error = null"
						class="w-full bg-white border text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none transition-colors pl-9 pr-4 h-[38px] rounded-lg"
						:class="[
							errors.email
								? 'border-red-400 focus:border-red-500'
								: 'border-zinc-200 focus:border-zinc-400'
						]"
					/>
				</div>
				<!-- Error near the relevant field -->
				<p v-if="errors.email" class="text-red-600 text-[12px] mt-1.5 flex items-center gap-1.5">
					<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
					{{ errors.email }}
				</p>
			</div>

			<!-- Password input -->
			<div class="space-y-1.5">
				<label for="password" class="text-xs font-medium text-zinc-650 block">Contraseña</label>
				<div class="relative">
					<span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
						<!-- Lock icon on the left -->
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</span>
					<input
						id="password"
						v-model="form.password"
						:type="showPassword ? 'text' : 'password'"
						placeholder="••••••••"
						@input="errors.password = ''; auth.error = null"
						class="w-full bg-white border text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none transition-colors pl-9 pr-10 h-[38px] rounded-lg"
						:class="[
							errors.password
								? 'border-red-400 focus:border-red-500'
								: 'border-zinc-200 focus:border-zinc-400'
						]"
					/>
					<!-- Show/hide password toggle (eye icon on the right) -->
					<button
						type="button"
						@click="showPassword = !showPassword"
						class="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
						title="Mostrar/Ocultar contraseña"
					>
						<!-- Open eye if showPassword is true, otherwise closed eye -->
						<svg v-if="showPassword" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.024 10.024 0 014.168-5.33m2.7-1.95A9.97 9.97 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.3" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M9.88 9.88a3 3 0 104.24 4.24M3 3l18 18" />
						</svg>
						<svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							<path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
						</svg>
					</button>
				</div>
				<!-- Error near the relevant field -->
				<p v-if="errors.password" class="text-red-600 text-[12px] mt-1.5 flex items-center gap-1.5">
					<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
					{{ errors.password }}
				</p>
			</div>

			<!-- Additional options (fully neutral) -->
			<div class="flex items-center justify-between pt-1 text-[12px]">
				<label class="flex items-center gap-2 cursor-pointer select-none">
					<CheckboxCustom v-model="form.rememberMe" size="sm" />
					<span class="text-zinc-500 hover:text-zinc-700 transition-colors">Recordar contraseña</span>
				</label>
				<a href="#" class="text-zinc-500 hover:text-zinc-700 transition-colors hover:underline">¿Olvidaste tu contraseña?</a>
			</div>

			<!-- Submit button (only solid blue accent element) -->
			<button
				type="submit"
				:disabled="isLoading"
				class="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-600/50 text-white font-medium text-sm h-[38px] rounded-lg transition-colors flex items-center justify-center gap-2 select-none cursor-pointer mt-4"
			>
				<svg v-if="isLoading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				<span v-if="!isLoading">Iniciar Sesión</span>
				<span v-else>Iniciando sesión...</span>
			</button>
		</form>
	</div>
</template>

<script setup>
import { ref, reactive, toRefs } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import CheckboxCustom from '@/components/widgets/CheckboxCustom.vue'

const router = useRouter()
const auth = useAuthStore()
const { loading: isLoading } = toRefs(auth)

const form = reactive({
	email: '',
	password: '',
	rememberMe: false,
})

const errors = reactive({
	email: '',
	password: '',
})

const showPassword = ref(false)

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

const handleSubmit = async () => {
	if (!validateForm()) return

	try {
		await auth.login(form.email, form.password)
		router.push('/dashboard')
	} catch {
		// auth.error is already set in the store and shown in the template
	}
}
</script>

<style scoped>

</style>
