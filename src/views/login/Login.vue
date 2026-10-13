<template>
	<div class="bg-surface border border-border rounded-md p-6 sm:p-8 relative">
		<!-- Header: same logo as the sidebar wordmark + page title -->
		<div class="flex flex-col items-center mb-6">
			<img src="@/assets/logo_pavh.png" alt="PAVH" class="w-14 h-14 mb-4 select-none" />
			<h1 class="font-serif text-2xl text-primary text-center">¡Bienvenido de nuevo!</h1>
			<p class="text-sm text-text-muted mt-1.5 text-center">Ingresa tus credenciales para acceder al sistema</p>
		</div>

		<!-- General server error (invalid credentials, etc.) -->
		<p v-if="auth.error" class="text-red-600 text-[12px] mb-4 flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
			<svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			{{ auth.error }}
		</p>

		<!-- Form -->
		<form novalidate @submit.prevent="handleSubmit" class="space-y-4">
			<!-- Email input -->
			<div class="space-y-1.5">
				<FieldLabel html-for="email" text="Correo electrónico" required />
				<div class="relative">
					<i class="ti ti-mail absolute left-3 top-1/2 -translate-y-1/2 text-base text-text-muted pointer-events-none" aria-hidden="true"></i>
					<InputTextCustom
						id="email"
						v-model="form.email"
						:error="errors.email"
						type="email"
						autocomplete="username"
						placeholder="ejemplo@correo.com"
						class="pl-9"
						@input="errors.email = ''; auth.error = null"
					/>
				</div>
				<p v-if="errors.email" class="text-danger text-xs mt-1.5">{{ errors.email }}</p>
			</div>

			<!-- Password input -->
			<div class="space-y-1.5">
				<FieldLabel html-for="password" text="Contraseña" required />
				<div class="relative">
					<i class="ti ti-lock absolute left-3 top-1/2 -translate-y-1/2 text-base text-text-muted pointer-events-none" aria-hidden="true"></i>
					<InputTextCustom
						id="password"
						v-model="form.password"
						:error="errors.password"
						:type="showPassword ? 'text' : 'password'"
						autocomplete="current-password"
						placeholder="••••••••"
						class="pl-9 pr-10"
						@input="errors.password = ''; auth.error = null"
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
				<p v-if="errors.password" class="text-danger text-xs mt-1.5">{{ errors.password }}</p>
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
import { ref, reactive, toRefs, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'
import FieldLabel from '@/components/widgets/labels/FieldLabel.vue'

const router = useRouter()
const auth = useAuthStore()
const { loading: isLoading } = toRefs(auth)

const form = reactive({
	email: '',
	password: '',
})

const errors = reactive({
	email: '',
	password: '',
})

const showPassword = ref(false)

onMounted(() => {
	document.getElementById('email')?.focus()
})

// Login only checks presence and email format: password rules belong to
// account creation, and the backend only requires a non-empty password.
const validateForm = () => {
	errors.email = ''
	errors.password = ''

	if (!form.email.trim()) {
		errors.email = 'Este campo es requerido'
	} else if (!/\S+@\S+\.\S+/.test(form.email.trim())) {
		errors.email = 'El formato del correo electrónico no es válido'
	}

	if (!form.password) {
		errors.password = 'Este campo es requerido'
	}

	return !errors.email && !errors.password
}

const handleSubmit = async () => {
	if (!validateForm()) return

	try {
		await auth.login(form.email.trim(), form.password)
		router.push('/dashboard')
	} catch {
		// auth.error is already set in the store and shown in the template
	}
}
</script>

<style scoped>

</style>
