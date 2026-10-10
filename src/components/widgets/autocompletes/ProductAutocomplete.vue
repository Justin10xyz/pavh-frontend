<template>
	<div class="relative">
		<InputTextCustom
			v-model="searchQuery"
			:placeholder="placeholder ?? defaultPlaceholder"
			@focus="showDropdown = true"
			@blur="closeDropdownDelayed"
		/>

		<div
			v-if="showDropdown && results.length > 0"
			class="absolute z-10 mt-1 w-full bg-surface border border-border rounded-md max-h-64 overflow-y-auto"
		>
			<button
				v-for="option in results"
				:key="`${option.type}-${option.id}`"
				type="button"
				@mousedown.prevent="selectOption(option)"
				class="w-full text-left px-3 py-2 hover:bg-bg transition-colors border-b border-border last:border-b-0"
			>
				<template v-if="option.type === 'variant'">
					<p class="text-sm text-text">{{ option.lineName }} — {{ option.color }} — {{ option.size }}</p>
					<p class="text-xs text-text-muted mt-0.5">
						{{ formatCurrency(option.price_per_m2) }}/m² · Stock: {{ option.stock_boxes }} cajas
					</p>
				</template>

				<template v-else>
					<p class="text-sm text-text flex items-center gap-2">
						{{ option.name }}
						<span class="text-[10px] text-text-muted border border-border rounded px-1.5 py-0.5">
							{{ option.categoryName }}
						</span>
					</p>
					<p class="text-xs text-text-muted mt-0.5">
						{{ formatCurrency(option.price) }} · Stock: {{ option.stock_quantity }} unidades
					</p>
				</template>
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
import { useSimpleProductsStore } from '@/stores/simpleProducts'
import { useCatalogsStore } from '@/stores/catalogs'
import { formatCurrency } from '@/lib/formatCurrency'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'

const props = defineProps({
	placeholder: { type: String, default: null },
	// Opt-in: quien lo usa debe saber manejar `option.type === 'simple'` antes de
	// recibir productos simples (si no, trataría su `id` como el de una variante).
	includeSimpleProducts: { type: Boolean, default: false },
})

// Expone la opción elegida con `type: 'variant' | 'simple'` para que quien lo
// usa sepa a qué campo asignar el id. Variantes llevan `lineName` agregado;
// productos simples, `categoryName`. Qué hacer con la opción (ej. fusionar con
// una línea duplicada) le corresponde a quien lo usa.
const emit = defineEmits(['select'])

const inventory = useInventoryStore()
const simpleProducts = useSimpleProductsStore()
const catalogs = useCatalogsStore()

const defaultPlaceholder = computed(() =>
	props.includeSimpleProducts ? 'Buscar por código, línea, color o nombre…' : 'Buscar por código, línea o color…',
)

onMounted(() => {
	if (!inventory.initialized && !inventory.loading) inventory.fetchProducts()

	if (props.includeSimpleProducts) {
		if (!simpleProducts.initialized && !simpleProducts.loading) simpleProducts.fetchSimpleProducts()
		if (!catalogs.initialized && !catalogs.loading) catalogs.fetchCatalogs()
	}
})

const searchQuery = ref('')
const showDropdown = ref(false)

// No hay endpoints de búsqueda por texto libre — se reutilizan los listados ya
// cacheados por Inventario y se filtra 100% client-side, mismo patrón que el
// buscador de InventoryView. `searchText` se arma una sola vez por opción y
// queda fuera de lo que se emite.
const variantOptions = computed(() => {
	const result = []
	for (const product of inventory.products) {
		for (const variant of product.variants ?? []) {
			result.push({
				option: { ...variant, type: 'variant', lineName: product.name },
				searchText: normalize(`${product.name} ${variant.color} ${variant.size} ${variant.code}`),
			})
		}
	}
	return result
})

// GET /api/simple-products no carga `category`; se resuelve contra el catálogo,
// igual que en SimpleProductsSection.
const simpleProductOptions = computed(() => {
	if (!props.includeSimpleProducts) return []

	const categoryNames = new Map(catalogs.categories.map((c) => [c.id, c.name]))
	return simpleProducts.simpleProducts.map((product) => {
		const categoryName = categoryNames.get(product.category_id) ?? ''
		return {
			option: { ...product, type: 'simple', categoryName },
			searchText: normalize(`${product.name} ${categoryName}`),
		}
	})
})

function normalize(str) {
	return (str ?? '')
		.toString()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
}

const MAX_RESULTS = 8

// Con la lista mezclada, los que empiezan con el término van primero (sort
// estable: dentro de cada grupo se respeta el orden original). Sin esto, las
// variantes —que van antes— podrían llenar los 8 lugares y ocultar los simples.
const results = computed(() => {
	const q = normalize(searchQuery.value).trim()
	if (!q) return []

	return [...variantOptions.value, ...simpleProductOptions.value]
		.filter((entry) => entry.searchText.includes(q))
		.sort((a, b) => Number(b.searchText.startsWith(q)) - Number(a.searchText.startsWith(q)))
		.slice(0, MAX_RESULTS)
		.map((entry) => entry.option)
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
</script>

<style scoped>

</style>
