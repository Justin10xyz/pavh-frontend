<template>
    <!-- Mobile-first: barra de solo íconos (w-16) por debajo de `lg`; desde `lg` se expande con labels. -->
    <aside class="w-16 lg:w-50 shrink-0 bg-primary flex flex-col h-full">
        <!-- Wordmark -->
        <router-link
            :to="{ name: 'dashboard' }"
            class="h-22 w-full flex items-center justify-center px-3 border-b border-white/10 shrink-0"
        >
            <!-- Colapsado: solo el ícono. Expandido: logo con el wordmark en blanco dentro de la imagen. -->
            <img
                src="@/assets/branding/icono-color-transparente.png"
                alt="INNOVA"
                class="w-10 h-auto lg:hidden"
            />
            <img
                src="@/assets/branding/logo-sin-tagline-icono-color-nombre-blanco.png"
                alt="INNOVA"
                class="hidden lg:block h-16 w-auto"
            />
        </router-link>

        <!-- Main navigation -->
        <nav class="flex-1 py-3 overflow-y-auto">
            <router-link
                v-for="link in navLinks"
                :key="link.name"
                :to="link.to"
                :class="linkClass(link.section)"
                :aria-label="link.name"
                v-tooltip.right="{ value: link.name, disabled: isExpanded }"
            >
                <i :class="['ti', link.icon, 'text-lg lg:text-base']"></i>
                <span class="hidden lg:inline">{{ link.name }}</span>
            </router-link>
        </nav>

        <!-- Settings -->
        <div class="border-t border-white/10 py-3 shrink-0">
            <router-link
                :to="{ name: 'settings.index' }"
                :class="linkClass('settings')"
                aria-label="Configuración"
                v-tooltip.right="{ value: 'Configuración', disabled: isExpanded }"
            >
                <i class="ti ti-settings text-lg lg:text-base"></i>
                <span class="hidden lg:inline">Configuración</span>
            </router-link>
        </div>
    </aside>
</template>

<script setup>
import { useRoute } from "vue-router";
import { useMediaQuery } from "@/composables/useMediaQuery";

const route = useRoute();

// Con el sidebar expandido (`lg`+) el label ya es visible; el tooltip solo aplica
// en la barra de íconos.
const isExpanded = useMediaQuery("(min-width: 64rem)");

// `section` debe coincidir con `meta.section` de las rutas: así el link se resalta
// también en sus vistas secundarias (ej. /inventario/productos/nuevo), que son
// rutas planas y no hijas, por lo que `router-link-active` no las detecta.
const navLinks = [
    {
        name: "Dashboard",
        to: { name: "dashboard" },
        section: "dashboard",
        icon: "ti-layout-dashboard",
    },
    { name: "Inventario", to: { name: "inventory" }, section: "inventory", icon: "ti-package" },
    {
        name: "Cotizaciones",
        to: { name: "quotes" },
        section: "quotes",
        icon: "ti-file-description",
    },
    {
        name: "Comprobantes",
        to: { name: "comprobantes.index" },
        section: "comprobantes",
        icon: "ti-receipt",
    },
    { name: "Punto de venta", to: { name: "pos" }, section: "pos", icon: "ti-shopping-cart" },
    { name: "Clientes", to: { name: "customers" }, section: "customers", icon: "ti-users" },
];

function linkClass(section) {
    return [
        "flex items-center justify-center lg:justify-start gap-3 px-0 lg:px-5 py-3 lg:py-2.5 text-sm border-l-2 transition-colors",
        route.meta.section === section
            ? "text-white bg-white/10 border-accent"
            : "text-white/70 border-transparent hover:text-white hover:bg-white/5",
    ];
}
</script>

<style scoped></style>
