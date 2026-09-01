<template>
	<div>
		<h1 class="font-serif text-2xl text-text">{{ route.meta.title }}</h1>
		<p class="text-text-muted mt-2">Este módulo está en construcción.</p>
	</div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>

</style>
