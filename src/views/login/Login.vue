<template>
	<div class="bg-surface border border-border rounded-md p-6 sm:p-8 relative">
		<!-- Header: logo completo (el wordmark INNOVA va dentro de la imagen) + page title -->
		<div class="flex flex-col items-center mb-6">
			<img
				src="@/assets/branding/logo-color-fondo-blanco.png"
				alt="INNOVA Pisos y Acabados"
				class="w-40 h-auto mb-4 select-none"
			/>
			<h1 class="font-serif text-xl text-primary text-center">Iniciar sesión</h1>
			<p class="text-sm text-text-muted mt-1 text-center">Ingresa tus credenciales para continuar</p>
		</div>

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
						class="pl-9 pr-10"
						@input="errors.password = ''; auth.error = null"
						@keydown="checkCapsLock"
						@keyup="checkCapsLock"
						@blur="capsLockOn = false"
					/>
					<!-- Toggle with a fixed name: aria-pressed carries the state, the label doesn't alternate -->
					<button
						type="button"
						aria-label="Mostrar contraseña"
						title="Mostrar contraseña"
						:aria-pressed="showPassword"
						aria-controls="password"
						@click="showPassword = !showPassword"
						class="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded text-text-muted hover:text-text focus:outline-none focus-visible:ring-1 focus-visible:ring-accent transition-colors cursor-pointer"
					>
						<i class="ti text-base" :class="showPassword ? 'ti-eye-off' : 'ti-eye'" aria-hidden="true"></i>
					</button>
				</div>
				<p v-if="errors.password" class="text-danger text-xs mt-1.5">{{ errors.password }}</p>
				<!-- Persistent live region: inserting it with v-if wouldn't be announced reliably -->
				<p aria-live="polite" class="text-text-muted text-xs">
					<span v-if="capsLockOn" class="flex items-center gap-1 mt-1.5">
						<i class="ti ti-arrow-big-up text-sm" aria-hidden="true"></i>
						Bloq Mayús está activado
					</span>
				</p>
			</div>

			<div class="pt-2 space-y-3">
				<!-- Submit error (invalid credentials, etc.) next to the button, same as the other forms -->
				<p v-if="auth.error" role="alert" class="text-danger text-sm flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
					<i class="ti ti-alert-triangle text-base shrink-0" aria-hidden="true"></i>
					{{ auth.error }}
				</p>

				<button
					type="submit"
					:disabled="isLoading"
					class="w-full bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors flex items-center justify-center gap-2 select-none cursor-pointer disabled:cursor-not-allowed"
				>
					<i v-if="isLoading" class="ti ti-loader animate-spin text-base" aria-hidden="true"></i>
					{{ isLoading ? 'Iniciando sesión…' : 'Iniciar sesión' }}
				</button>
			</div>
		</form>
	</div>
</template>

<script setup>
import { ref, reactive, toRefs, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'
import FieldLabel from '@/components/widgets/labels/FieldLabel.vue'

const route = useRoute()
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

// Caps Lock is the usual cause of "invalid credentials" with the right password.
// Only detectable from a key event, so it's checked while typing in the field.
const capsLockOn = ref(false)
const checkCapsLock = (event) => {
	capsLockOn.value = event.getModifierState?.('CapsLock') ?? false
}

onMounted(() => {
	document.getElementById('email')?.focus()
})

// auth.error lives in the store: clear it so it doesn't reappear on the next visit to login.
onBeforeUnmount(() => {
	auth.error = null
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

// Only internal paths from ?redirect= (set by the guard); anything else falls back to the dashboard.
const redirectTarget = () => {
	const redirect = route.query.redirect
	if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
		return redirect
	}
	return { name: 'dashboard' }
}

const focusField = (id) => document.getElementById(id)?.focus()

const handleSubmit = async () => {
	if (!validateForm()) {
		// Focus the first field with an error so it can be fixed without the mouse.
		focusField(errors.email ? 'email' : 'password')
		return
	}

	try {
		await auth.login(form.email.trim(), form.password)
		router.replace(redirectTarget())
	} catch (err) {
		// auth.error is already set in the store and shown in the template.
		// Invalid credentials (422): keep the email, clear the password and focus it
		// to retype. Other errors (network, throttling) keep both for a plain retry.
		if (err.response?.status === 422) {
			form.password = ''
			focusField('password')
		}
	}
}
</script>

<style scoped>

</style>
