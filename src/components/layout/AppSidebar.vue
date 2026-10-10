<template>
	<aside class="w-[200px] shrink-0 bg-primary flex flex-col h-screen sticky top-0">
		<!-- Wordmark -->
		<router-link :to="{ name: 'dashboard' }" class="h-[52px] flex items-center gap-2 px-5 border-b border-white/10 shrink-0">
			<img src="@/assets/logo_pavh.png" class="w-10 h-10" />
			<span class="font-serif text-lg text-white tracking-wide">PAVH</span>
		</router-link>

		<!-- Main navigation -->
		<nav class="flex-1 py-3">
			<router-link
				v-for="link in navLinks"
				:key="link.name"
				:to="link.to"
				:class="linkClass(link.section)"
			>
				<i :class="['ti', link.icon, 'text-base']"></i>
				<span>{{ link.name }}</span>
			</router-link>
		</nav>

		<!-- Settings -->
		<div class="border-t border-white/10 py-3 shrink-0">
			<router-link
				:to="{ name: 'settings.index' }"
				:class="linkClass('settings')"
			>
				<i class="ti ti-settings text-base"></i>
				<span>Configuración</span>
			</router-link>
		</div>
	</aside>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

// `section` debe coincidir con `meta.section` de las rutas: así el link se resalta
// también en sus vistas secundarias (ej. /inventario/productos/nuevo), que son
// rutas planas y no hijas, por lo que `router-link-active` no las detecta.
const navLinks = [
	{ name: 'Dashboard', to: { name: 'dashboard' }, section: 'dashboard', icon: 'ti-layout-dashboard' },
	{ name: 'Inventario', to: { name: 'inventory' }, section: 'inventory', icon: 'ti-package' },
	{ name: 'Cotizaciones', to: { name: 'quotes' }, section: 'quotes', icon: 'ti-file-description' },
	{ name: 'Punto de venta', to: { name: 'pos' }, section: 'pos', icon: 'ti-shopping-cart' },
	{ name: 'Clientes', to: { name: 'customers' }, section: 'customers', icon: 'ti-users' },
]

function linkClass(section) {
	return [
		'flex items-center gap-3 px-5 py-2.5 text-sm border-l-2 transition-colors',
		route.meta.section === section
			? 'text-white bg-white/10 border-accent'
			: 'text-white/70 border-transparent hover:text-white hover:bg-white/5',
	]
}
</script>

<style scoped>

</style>
