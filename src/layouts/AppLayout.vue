<template>
	<div class="min-h-screen flex bg-bg font-sans antialiased">
		<AppSidebar />

		<div class="flex flex-col flex-1 min-w-0">
			<AppTopbar />

			<main class="flex-1 p-8">
				<slot></slot>
			</main>
		</div>
	</div>
</template>

<script setup>
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
</script>
