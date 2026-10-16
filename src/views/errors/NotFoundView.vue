<template>
    <div class="p-2 flex items-center justify-center min-h-[60vh]">
        <div class="bg-surface border border-border rounded-md p-6 sm:p-8 w-full max-w-md text-center">
            <span class="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-md bg-primary text-white">
                <i class="ti ti-map-search text-2xl" aria-hidden="true"></i>
            </span>
            <p class="font-serif text-4xl text-primary">404</p>
            <h1 class="font-serif text-xl text-primary mt-2">Página no encontrada</h1>
            <p class="text-sm text-text-muted mt-1">
                La ruta <span class="font-mono text-text break-all">{{ route.fullPath }}</span> no existe o fue movida.
            </p>
            <RouterLink
                :to="{ name: 'dashboard' }"
                class="mt-6 bg-primary hover:bg-primary-dark text-white font-medium text-sm h-10 px-4 rounded-md transition-colors inline-flex items-center gap-2 select-none"
            >
                <i class="ti ti-arrow-left" aria-hidden="true"></i>
                Volver al dashboard
            </RouterLink>
        </div>
    </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>
