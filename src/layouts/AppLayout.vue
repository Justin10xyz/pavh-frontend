<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const isMobileMenuOpen = ref(false)

const navLinks = [
	{ name: 'Inicio', path: '/', icon: 'HomeIcon' },
	{ name: 'Acerca de', path: '/about', icon: 'InfoIcon' }
]

const navigateTo = (path) => {
	router.push(path)
	isMobileMenuOpen.value = false
}

const logout = () => {
	// Enrutamiento simulado al login
	router.push('/login')
}
</script>

<template>
	<div class="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased selection:bg-indigo-500 selection:text-white">
		<!-- Desktop Sidebar -->
		<aside class="hidden md:flex flex-col w-64 border-r border-slate-800/80 bg-slate-900/40 backdrop-blur-xl">
			<!-- Sidebar Header / Logo -->
			<div class="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
				<div class="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
					<span class="font-bold text-white text-base">P</span>
				</div>
				<span class="font-semibold text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">PAVH Admin</span>
			</div>

			<!-- Navigation Links -->
			<nav class="flex-1 px-4 py-6 space-y-1.5">
				<button
					v-for="link in navLinks"
					:key="link.path"
					@click="navigateTo(link.path)"
					class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium cursor-pointer"
					:class="[
						route.path === link.path
							? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
							: 'text-slate-400 hover:text-white hover:bg-slate-800/40'
					]"
				>
					<svg v-if="link.icon === 'HomeIcon'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
					</svg>
					<svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					{{ link.name }}
				</button>
			</nav>

			<!-- User Profile Card -->
			<div class="p-4 border-t border-slate-800/80 bg-slate-950/20">
				<div class="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/30 transition-all duration-200 group">
					<div class="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 border border-indigo-400/20 flex items-center justify-center font-bold text-white text-sm shadow-md">
						JU
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-sm font-semibold text-slate-200 truncate leading-none">Justin</p>
						<span class="text-xs text-slate-500 truncate mt-1 block">justin@domain.com</span>
					</div>
					<button @click="logout" class="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer" title="Cerrar sesión">
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
						</svg>
					</button>
				</div>
			</div>
		</aside>

		<!-- Mobile Header & Main View -->
		<div class="flex flex-col flex-1 min-w-0 min-h-screen">
			<header class="md:hidden h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
				<div class="flex items-center gap-3">
					<div class="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center">
						<span class="font-bold text-white text-base">P</span>
					</div>
					<span class="font-semibold text-lg text-white">PAVH Admin</span>
				</div>
				<button
					@click="isMobileMenuOpen = !isMobileMenuOpen"
					class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
				>
					<svg v-if="!isMobileMenuOpen" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
					<svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</header>

			<!-- Mobile Dropdown Navigation -->
			<transition
				enter-active-class="transition duration-200 ease-out"
				enter-from-class="transform -translate-y-4 opacity-0"
				enter-to-class="transform translate-y-0 opacity-100"
				leave-active-class="transition duration-150 ease-in"
				leave-from-class="transform translate-y-0 opacity-100"
				leave-to-class="transform -translate-y-4 opacity-0"
			>
				<div v-if="isMobileMenuOpen" class="md:hidden border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl px-6 py-4 space-y-2 sticky top-16 z-30 shadow-2xl">
					<button
						v-for="link in navLinks"
						:key="link.path"
						@click="navigateTo(link.path)"
						class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium cursor-pointer"
						:class="[
							route.path === link.path
								? 'bg-indigo-600 text-white'
								: 'text-slate-400 hover:text-white hover:bg-slate-800'
						]"
					>
						<svg v-if="link.icon === 'HomeIcon'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
						</svg>
						<svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						{{ link.name }}
					</button>
          
					<div class="pt-4 border-t border-slate-800 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<div class="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white text-xs">
								JU
							</div>
							<div>
								<p class="text-sm font-semibold text-slate-200 leading-none">Justin</p>
								<p class="text-xs text-slate-500 mt-1">justin@domain.com</p>
							</div>
						</div>
						<button @click="logout" class="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer">
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
							</svg>
						</button>
					</div>
				</div>
			</transition>

			<!-- Main Content Container -->
			<main class="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
				<slot></slot>
			</main>
		</div>
	</div>
</template>
