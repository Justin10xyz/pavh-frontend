<template>
	<div class="relative">
		<!-- Combobox con teclado (↑/↓ para moverse, Enter para elegir, Esc para
		     cerrar), mismo patrón ARIA que CustomerSearch -->
		<InputTextCustom
			:id="inputId"
			v-model="searchQuery"
			role="combobox"
			autocomplete="off"
			aria-autocomplete="list"
			:aria-expanded="dropdownOpen"
			:aria-controls="listboxId"
			:aria-activedescendant="dropdownOpen && results[activeIndex] ? optionId(activeIndex) : undefined"
			:placeholder="placeholder ?? defaultPlaceholder"
			@focus="openDropdown"
			@input="openDropdown"
			@blur="closeDropdownDelayed"
			@keydown="onKeydown"
		/>

		<ul
			v-if="dropdownOpen && results.length > 0"
			:id="listboxId"
			ref="listbox"
			role="listbox"
			class="absolute z-10 mt-1 w-full bg-surface border border-border rounded-md max-h-64 overflow-y-auto"
		>
			<li
				v-for="(option, index) in results"
				:id="optionId(index)"
				:key="`${option.type}-${option.id}`"
				role="option"
				:aria-selected="index === activeIndex"
				class="px-3 py-2 cursor-pointer border-b border-border last:border-b-0 transition-colors"
				:class="index === activeIndex ? 'bg-bg' : ''"
				@mousedown.prevent="selectOption(option)"
				@mousemove="activeIndex = index"
			>
				<template v-if="option.type === 'variant'">
					<p class="text-sm text-text">{{ option.lineName }} — {{ option.color }} — {{ option.size }}</p>
					<p class="text-xs text-text-muted mt-0.5">
						{{ formatCurrency(option.price_per_m2) }}/m² ·
						{{ option.stock_boxes === null ? 'Sin control de stock' : `Stock: ${option.stock_boxes} cajas` }}
					</p>
				</template>

				<template v-else>
					<p class="text-sm text-text flex items-center gap-2">
						{{ option.name }}
						<span class="text-xs text-text-muted border border-border rounded px-1.5 py-0.5">
							{{ option.categoryName }}
						</span>
					</p>
					<p class="text-xs text-text-muted mt-0.5">
						{{ formatCurrency(option.price) }} ·
						{{ option.stock_quantity === null ? 'Sin control de stock' : `Stock: ${option.stock_quantity} unidades` }}
					</p>
				</template>
			</li>
		</ul>

		<p
			v-else-if="dropdownOpen && searchQuery.trim()"
			class="absolute z-10 mt-1 w-full bg-surface border border-border rounded-md px-3 py-2 text-xs text-text-muted"
		>
			Sin resultados.
		</p>
	</div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, useId, useTemplateRef } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { useSimpleProductsStore } from '@/stores/simpleProducts'
import { useCatalogsStore } from '@/stores/catalogs'
import { formatCurrency } from '@/lib/formatCurrency'
import InputTextCustom from '@/components/widgets/InputTextCustom.vue'

const props = defineProps({
	placeholder: { type: String, default: null },
	// Para asociar un <label for> externo al input de búsqueda.
	inputId: { type: String, default: undefined },
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
const dropdownOpen = ref(false)
const activeIndex = ref(0)

const listboxId = useId()
function optionId(index) {
	return `${listboxId}-option-${index}`
}

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

function openDropdown() {
	dropdownOpen.value = true
	activeIndex.value = 0
}

// Cierra el dropdown al perder foco, con un pequeño delay para que el click
// en un resultado (mousedown.prevent) alcance a registrarse antes del blur.
function closeDropdownDelayed() {
	setTimeout(() => {
		dropdownOpen.value = false
	}, 150)
}

// La lista tiene scroll propio (max-h-64): la opción activa se mantiene visible
// al moverse con flechas.
const listbox = useTemplateRef('listbox')
async function moveActive(index) {
	activeIndex.value = index
	await nextTick()
	listbox.value?.querySelector(`#${CSS.escape(optionId(index))}`)?.scrollIntoView({ block: 'nearest' })
}

function onKeydown(event) {
	if (event.key === 'ArrowDown') {
		event.preventDefault()
		if (!dropdownOpen.value) return openDropdown()
		moveActive(Math.max(0, Math.min(activeIndex.value + 1, results.value.length - 1)))
	} else if (event.key === 'ArrowUp') {
		event.preventDefault()
		moveActive(Math.max(activeIndex.value - 1, 0))
	} else if (event.key === 'Enter') {
		// Nunca envía el form de la cotización/venta desde el buscador.
		event.preventDefault()
		const option = dropdownOpen.value && results.value[activeIndex.value]
		if (option) selectOption(option)
	} else if (event.key === 'Escape' && dropdownOpen.value) {
		// Solo consume Esc si había algo que cerrar.
		event.preventDefault()
		dropdownOpen.value = false
	}
}

function selectOption(option) {
	emit('select', option)
	searchQuery.value = ''
	dropdownOpen.value = false
}
</script>

<style scoped>

</style>
