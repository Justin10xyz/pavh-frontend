<template>
	<aside class="w-[200px] shrink-0 bg-primary flex flex-col h-screen sticky top-0">
		<!-- Wordmark -->
		<div class="h-[52px] flex items-center px-5 border-b border-white/10 shrink-0">
			<span class="font-serif text-lg text-white tracking-wide">PV</span>
		</div>

		<!-- Main navigation -->
		<nav class="flex-1 py-3">
			<router-link
				v-for="link in navLinks"
				:key="link.name"
				:to="link.to"
				class="flex items-center gap-3 px-5 py-2.5 text-sm text-white/70 border-l-2 border-transparent transition-colors hover:text-white hover:bg-white/5 [&.router-link-active]:text-white [&.router-link-active]:bg-white/10 [&.router-link-active]:border-accent"
			>
				<i :class="['ti', link.icon, 'text-base']"></i>
				<span>{{ link.name }}</span>
			</router-link>
		</nav>

		<!-- Settings: no route yet, visual placeholder -->
		<div class="border-t border-white/10 py-3 shrink-0">
			<span class="flex items-center gap-3 px-5 py-2.5 text-sm text-white/40 cursor-default">
				<i class="ti ti-settings text-base"></i>
				<span>Configuración</span>
			</span>
		</div>
	</aside>
</template>

<script setup>
const navLinks = [
	{ name: 'Dashboard', to: { name: 'dashboard' }, icon: 'ti-layout-dashboard' },
	{ name: 'Inventario', to: { name: 'inventory' }, icon: 'ti-package' },
	{ name: 'Cotizaciones', to: { name: 'quotes' }, icon: 'ti-file-description' },
	{ name: 'Punto de venta', to: { name: 'pos' }, icon: 'ti-shopping-cart' },
]
</script>

<style scoped>

</style>
