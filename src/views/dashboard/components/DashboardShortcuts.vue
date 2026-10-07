<template>
	<section aria-labelledby="shortcuts-heading">
		<h2 id="shortcuts-heading" class="text-sm font-medium text-text-muted mb-2">Accesos directos</h2>
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
			<router-link
				v-for="shortcut in shortcuts"
				:key="shortcut.route"
				:to="{ name: shortcut.route }"
				class="group flex items-center gap-4 bg-surface border border-border rounded-md p-4 hover:border-accent focus:outline-none focus-visible:border-accent transition-colors"
			>
				<span class="w-10 h-10 flex items-center justify-center rounded-md bg-primary text-white flex-shrink-0">
					<i :class="['ti', shortcut.icon, 'text-lg']"></i>
				</span>
				<span class="flex-1 min-w-0 text-sm font-medium text-text">{{ shortcut.label }}</span>
				<i class="ti ti-chevron-right text-text-muted group-hover:text-text transition-colors"></i>
			</router-link>
		</div>
	</section>
</template>

<script setup>
const shortcuts = [
	{ route: 'pos.sales.create', label: 'Nueva venta', icon: 'ti-shopping-cart' },
	{ route: 'quotes.create', label: 'Nueva cotización', icon: 'ti-file-text' },
	{ route: 'inventory', label: 'Inventario', icon: 'ti-package' },
]
</script>

<style scoped>

</style>
