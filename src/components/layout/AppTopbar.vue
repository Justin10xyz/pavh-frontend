<template>
	<header class="h-[52px] bg-surface border-b border-border flex items-center justify-between px-6 shrink-0">
		<h1 class="text-sm font-medium text-text">{{ pageTitle }}</h1>

		<div class="flex items-center gap-3">
			<span class="text-sm text-text-muted">{{ userName }}</span>
			<div class="h-8 w-8 rounded-full bg-primary text-white text-xs font-medium flex items-center justify-center">
				{{ userInitials }}
			</div>
		</div>
	</header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const pageTitle = computed(() => route.meta.title || '')

const userName = computed(() => auth.user?.name || '')

const userInitials = computed(() => {
	if (!userName.value) return ''
	return userName.value
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('')
})
</script>
