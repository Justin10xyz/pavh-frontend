<template>
	<header
		class="h-13 bg-surface border-b border-border flex items-center justify-between gap-4 px-4 sm:px-6 shrink-0"
	>
		<h1 class="min-w-0 truncate text-sm font-medium text-text">{{ pageTitle }}</h1>

		<div class="relative shrink-0" ref="userMenuRef">
			<!-- Patrón disclosure (aria-expanded + aria-controls), no role="menu": no navega con flechas -->
			<button
				ref="userMenuButtonRef"
				@click="toggleUserMenu"
				class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-bg transition-colors duration-150 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent select-none"
				:aria-label="`Menú de usuario de ${userName}`"
				:aria-expanded="isUserMenuOpen"
				aria-controls="user-menu"
			>
				<!-- Por debajo de `sm` solo se muestran las iniciales; el nombre completo sigue en el menú. -->
				<span
					class="hidden sm:block max-w-48 truncate text-sm font-medium text-text-muted"
					>{{ userName }}</span
				>
				<div
					class="h-8 w-8 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center"
					aria-hidden="true"
				>
					{{ userInitials }}
				</div>
				<i
					class="ti ti-chevron-down text-sm text-text-muted transition-transform duration-200"
					aria-hidden="true"
					:class="{ 'rotate-180': isUserMenuOpen }"
				></i>
			</button>

			<!-- Dropdown Menu -->
			<transition
				enter-active-class="transition ease-out duration-100"
				enter-from-class="transform opacity-0 scale-95"
				enter-to-class="transform opacity-100 scale-100"
				leave-active-class="transition ease-in duration-75"
				leave-from-class="transform opacity-100 scale-100"
				leave-to-class="transform opacity-0 scale-95"
			>
				<div
					v-if="isUserMenuOpen"
					id="user-menu"
					class="absolute right-0 mt-1.5 w-56 max-w-[calc(100vw-2rem)] bg-surface rounded-md border border-border shadow-lg py-1 z-50 origin-top-right focus:outline-none"
				>
					<div class="px-4 py-2.5 border-b border-border">
						<p class="text-xs uppercase tracking-wider font-semibold text-text-muted">
							Conectado como
						</p>
						<p class="text-sm font-semibold text-text truncate mt-0.5">
							{{ userName }}
						</p>
						<p v-if="userEmail" class="text-xs text-text-muted truncate">
							{{ userEmail }}
						</p>
					</div>

					<div class="py-1">
						<button
							@click="handleLogout"
							:disabled="isLoggingOut"
							class="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-danger/5 focus:outline-none focus-visible:bg-danger/5 transition-colors cursor-pointer text-left disabled:opacity-50"
						>
							<i
								v-if="!isLoggingOut"
								class="ti ti-logout text-base"
								aria-hidden="true"
							></i>
							<i
								v-else
								class="ti ti-loader animate-spin text-base"
								aria-hidden="true"
							></i>
							<span>{{ isLoggingOut ? "Cerrando sesión…" : "Cerrar sesión" }}</span>
						</button>
					</div>
				</div>
			</transition>
		</div>
	</header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const pageTitle = computed(() => route.meta.title || "");

const userName = computed(() => auth.user?.name || "");
const userEmail = computed(() => auth.user?.email || "");

const userInitials = computed(() => {
	if (!userName.value) return "";
	return userName.value
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join("");
});

// Dropdown State and Click Outside logic
const userMenuRef = ref(null);
const userMenuButtonRef = ref(null);
const isUserMenuOpen = ref(false);
const isLoggingOut = ref(false);

const toggleUserMenu = () => {
	isUserMenuOpen.value = !isUserMenuOpen.value;
};

const closeUserMenu = (event) => {
	if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
		isUserMenuOpen.value = false;
	}
};

// Esc cierra el menú y devuelve el foco al botón que lo abrió.
const closeUserMenuOnEscape = (event) => {
	if (event.key === "Escape" && isUserMenuOpen.value) {
		isUserMenuOpen.value = false;
		userMenuButtonRef.value?.focus();
	}
};

onMounted(() => {
	document.addEventListener("click", closeUserMenu);
	document.addEventListener("keydown", closeUserMenuOnEscape);
});

onUnmounted(() => {
	document.removeEventListener("click", closeUserMenu);
	document.removeEventListener("keydown", closeUserMenuOnEscape);
});

const handleLogout = async () => {
	if (isLoggingOut.value) return;
	isLoggingOut.value = true;
	try {
		// logout() no falla: si la petición se cae, la sesión local se limpia igual.
		await auth.logout();
		router.push({ name: "login" });
	} finally {
		isLoggingOut.value = false;
		isUserMenuOpen.value = false;
	}
};
</script>

<style scoped></style>
