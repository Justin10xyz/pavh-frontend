<template>
    <component :is="currentLayout">
        <RouterView />
    </component>
    <AppToast />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppToast from '@/components/layout/AppToast.vue'

const route = useRoute()

const layouts = {
    AppLayout,
    AuthLayout,
}

const currentLayout = computed(() => {
    const layoutName = route.meta.layout || 'AppLayout'
    return layouts[layoutName] || AppLayout
})
</script>

<style scoped>
/* Global styles and transitions */
</style>
