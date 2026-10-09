<template>
	<div class="p-2 max-w-4xl">
		<div class="mb-4">
			<h1 class="font-serif text-xl text-primary">Configuración</h1>
			<p class="text-sm text-text-muted mt-0.5">Administra los catálogos del sistema.</p>
		</div>

		<div class="flex flex-wrap gap-3">
			<router-link
				:to="{ name: 'settings.categories' }"
				class="group flex items-center gap-4 w-full sm:w-80 bg-surface border border-border rounded-md p-5 hover:border-accent focus:outline-none focus-visible:border-accent transition-colors"
			>
				<span class="w-10 h-10 flex items-center justify-center rounded-md bg-primary text-white flex-shrink-0">
					<i class="ti ti-category text-lg"></i>
				</span>
				<span class="flex-1 min-w-0">
					<span class="block text-sm font-medium text-text">Categorías de producto</span>
					<span class="block text-xs text-text-muted mt-0.5">Consulta y agrega las categorías del inventario.</span>
				</span>
				<i class="ti ti-chevron-right text-text-muted group-hover:text-text transition-colors"></i>
			</router-link>
		</div>
	</div>
</template>

<script setup>

</script>

<style scoped>

</style>
