<template>
	<div class="relative">
		<InputTextCustom
			v-model="searchQuery"
			:placeholder="placeholder"
			@focus="showDropdown = true"
			@blur="closeDropdownDelayed"
		/>

		<div
			v-if="showDropdown && results.length > 0"
			class="absolute z-10 mt-1 w-full bg-surface border border-border rounded-md max-h-64 overflow-y-auto"
		>
			<button
				v-for="option in results"
				:key="option.id"
				type="button"
				@mousedown.prevent="selectOption(option)"
				class="w-full text-left px-3 py-2 hover:bg-bg transition-colors border-b border-border last:border-b-0"
			>
				<p class="text-sm text-text">{{ option.lineName }} — {{ option.color }} — {{ option.size }}</p>
				<p class="text-xs text-text-muted mt-0.5">
					{{ formatCurrency(option.price_per_m2) }}/m² · Stock: {{ option.stock_boxes }} cajas
				</p>
			</button>
		</div>

		<p
			v-else-if="showDropdown && searchQuery.trim()"
			class="absolute z-10 mt-1 w-full bg-surface border border-border rounded-md px-3 py-2 text-xs text-text-muted"
		>
			Sin resultados.
		</p>
	</div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'

defineProps({
	placeholder: { type: String, default: 'Buscar por código, línea o color…' },
})

// Solo expone la variante elegida (con `lineName` agregado); qué hacer con
// ella (ej. fusionar con una línea duplicada) le corresponde a quien lo usa.
const emit = defineEmits(['select'])

const inventory = useInventoryStore()

onMounted(() => {
	if (!inventory.initialized && !inventory.loading) inventory.fetchProducts()
})

const searchQuery = ref('')
const showDropdown = ref(false)

// GET /api/product-variants no soporta búsqueda de texto libre — se reutiliza
// inventory.fetchProducts() (ya usado por InventoryView) y se filtra 100%
// client-side, mismo patrón que el buscador de InventoryView.
const flatVariants = computed(() => {
	const result = []
	for (const product of inventory.products) {
		for (const variant of product.variants ?? []) {
			result.push({ ...variant, lineName: product.name })
		}
	}
	return result
})

function normalize(str) {
	return (str ?? '')
		.toString()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
}

const results = computed(() => {
	const q = normalize(searchQuery.value).trim()
	if (!q) return []

	return flatVariants.value
		.filter((v) => normalize(`${v.lineName} ${v.color} ${v.size} ${v.code}`).includes(q))
		.slice(0, 8)
})

// Cierra el dropdown al perder foco, con un pequeño delay para que el click
// en un resultado (mousedown.prevent) alcance a registrarse antes del blur.
function closeDropdownDelayed() {
	setTimeout(() => {
		showDropdown.value = false
	}, 150)
}

function selectOption(option) {
	emit('select', option)
	searchQuery.value = ''
	showDropdown.value = false
}

const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function formatCurrency(value) {
	return currencyFormatter.format(Number(value) || 0)
}
</script>

<style scoped>

</style>
