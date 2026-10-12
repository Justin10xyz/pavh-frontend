<template>
	<Toast position="top-right" :pt="pt">
		<template #container="{ message, closeCallback }">
			<div
				class="flex items-start gap-3 bg-surface border border-border border-l-[3px] rounded-md px-4 py-3 shadow-sm"
				:class="SEVERITY[message.severity]?.border ?? SEVERITY.success.border"
			>
				<i
					class="ti text-lg leading-none mt-px"
					:class="SEVERITY[message.severity]?.icon ?? SEVERITY.success.icon"
					aria-hidden="true"
				></i>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-text">{{ message.summary }}</p>
					<p v-if="message.detail" class="text-xs text-text-muted mt-0.5">
						{{ message.detail }}
					</p>
				</div>
				<button
					type="button"
					class="shrink-0 flex items-center p-1 -m-1 rounded text-text-muted hover:bg-bg hover:text-text transition-colors cursor-pointer"
					aria-label="Cerrar aviso"
					@click="closeCallback"
				>
					<i class="ti ti-x text-sm" aria-hidden="true"></i>
				</button>
			</div>
		</template>
	</Toast>
</template>

<script setup>
import Toast from 'primevue/toast'

// Único <Toast> de la app, montado en App.vue (fuera del layout, para que un
// aviso sobreviva a una navegación que cambie de layout). Las vistas no usan
// useToast() directo sino useNotify(), que fija severidad y duración.
//
// Solo para confirmar acciones exitosas: errores de validación y de guardado
// siguen inline junto a donde ocurrieron (ver AGENT.md).
const SEVERITY = {
	success: { border: 'border-l-success', icon: 'ti-circle-check text-success' },
	info: { border: 'border-l-primary', icon: 'ti-info-circle text-primary' },
}

// Unstyled: el contenedor no trae posición propia (se monta en <body>). Los
// mensajes llevan markup propio vía #container; aquí solo va lo que no lo tiene.
const pt = {
	root: { class: 'fixed top-4 right-4 w-88 max-w-[calc(100vw-2rem)]' },
	message: { class: 'mb-2' },
	transition: {
		enterFromClass: 'opacity-0 translate-x-4',
		enterActiveClass: 'transition duration-200 ease-out',
		leaveActiveClass: 'transition duration-150 ease-in',
		leaveToClass: 'opacity-0',
	},
}
</script>

<style scoped></style>
