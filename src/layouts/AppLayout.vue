<template>
    <!-- h-dvh en vez de h-screen: en tablets/móviles respeta la barra del navegador. -->
    <div class="h-dvh flex bg-bg font-sans antialiased overflow-hidden">
        <AppSidebar />

        <div class="flex flex-col flex-1 min-w-0 h-full">
            <AppTopbar />

            <!-- `relative`: ancla los descendientes `absolute` (p.ej. `sr-only`) al
                 contenedor con scroll; sin él se posicionan contra el documento y
                 estiran el <body>, provocando un segundo scroll con espacio en blanco. -->
            <main class="relative flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <slot />
            </main>
        </div>
    </div>
</template>

<script setup>
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
</script>

<style scoped>

</style>
