<template>
	<Dialog v-model:visible="visible" modal :pt="{ mask: { class: 'bg-primary/50' } }" @hide="reset">
		<template #container="{ closeCallback }">
			<div v-if="variant" class="bg-surface border border-border rounded-md p-5 w-[380px] max-w-[90vw]">
				<div class="flex items-center justify-between mb-4">
					<h3 class="font-serif text-base text-primary">Ajustar stock</h3>
					<button type="button" @click="closeCallback" class="text-text-muted hover:text-text transition-colors" aria-label="Cerrar">
						<i class="ti ti-x text-base"></i>
					</button>
				</div>

				<div class="text-sm text-text mb-4">
					<span class="text-text-muted">{{ variant.color }} · </span>
					Stock actual: <span class="font-medium">{{ variant.stock_boxes }} cj</span>
				</div>

				<div class="flex gap-2 mb-4">
					<button
						type="button"
						@click="stockAdjustType = 'add'"
						class="flex-1 h-[38px] rounded-md text-sm font-medium border transition-colors"
						:class="stockAdjustType === 'add' ? 'bg-success/10 border-success text-success' : 'border-border text-text-muted hover:text-text'"
					>
						Agregar
					</button>
					<button
						type="button"
						@click="stockAdjustType = 'subtract'"
						class="flex-1 h-[38px] rounded-md text-sm font-medium border transition-colors"
						:class="stockAdjustType === 'subtract' ? 'bg-danger/10 border-danger text-danger' : 'border-border text-text-muted hover:text-text'"
					>
						Quitar
					</button>
				</div>

				<div class="space-y-1.5 mb-4">
					<label for="stock_adjust_quantity" class="text-xs font-medium text-text-muted block">Cantidad (cajas)</label>
					<InputNumberCustom
						id="stock_adjust_quantity"
						v-model="stockAdjustQuantity"
						:min="1"
						placeholder="0"
						:max-fraction-digits="0"
					/>
				</div>

				<p v-if="stockDialogError" class="text-danger text-[12px] mb-4">{{ stockDialogError }}</p>

				<div class="flex items-center justify-end gap-3">
					<button
						type="button"
						@click="closeCallback"
						class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
					>
						Cancelar
					</button>
					<button
						type="button"
						@click="submitStockAdjust"
						:disabled="!isStockAdjustValid || stockAdjustSubmitting"
						class="bg-primary hover:bg-primary-dark disabled:bg-primary/50 text-white font-medium text-sm h-[38px] px-4 rounded-md transition-colors select-none cursor-pointer"
					>
						{{ stockAdjustSubmitting ? 'Aplicando…' : 'Aplicar' }}
					</button>
				</div>
			</div>
		</template>
	</Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import axios from '@/lib/axios'
import { useInventoryStore } from '@/stores/inventory'
import InputNumberCustom from '@/components/widgets/InputNumberCustom.vue'

const props = defineProps({
	variant: {
		type: Object,
		default: null,
	}
})

const visible = defineModel('visible', { type: Boolean, default: false })
const emit = defineEmits(['stock-updated'])

const inventory = useInventoryStore()

const stockAdjustType = ref('add')
const stockAdjustQuantity = ref(null)
const stockDialogError = ref(null)
const stockAdjustSubmitting = ref(false)

const isStockAdjustValid = computed(
	() => Number.isInteger(stockAdjustQuantity.value) && stockAdjustQuantity.value > 0
)

function reset() {
	stockAdjustType.value = 'add'
	stockAdjustQuantity.value = null
	stockDialogError.value = null
}

async function submitStockAdjust() {
	if (!isStockAdjustValid.value || !props.variant) return

	stockAdjustSubmitting.value = true
	stockDialogError.value = null

	try {
		const { data } = await axios.patch(`/api/product-variants/${props.variant.id}/stock`, {
			quantity: stockAdjustQuantity.value,
			type: stockAdjustType.value,
		})

		inventory.updateVariantStock(props.variant.id, {
			stock_boxes: data.data.stock_boxes,
			low_stock: data.data.low_stock,
		})

		emit('stock-updated', data.data)
		visible.value = false
	} catch (err) {
		stockDialogError.value = err.response?.data?.message || 'No se pudo ajustar el stock. Intenta de nuevo.'
	} finally {
		stockAdjustSubmitting.value = false
	}
}
</script>
