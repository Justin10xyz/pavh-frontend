<template>
    <div class="p-2 max-w-4xl">
        <div class="mb-4">
            <h1 class="font-serif text-xl text-primary">{{ quoteId ? 'Convertir presupuesto a venta' : route.meta.title }}</h1>
            <p v-if="quoteId" class="text-sm text-text-muted mt-0.5">
                Revisa y ajusta los datos prellenados desde el
                <router-link :to="{ name: 'quotes.show', params: { id: quoteId } }" class="text-accent hover:underline">presupuesto de origen</router-link>.
            </p>
            <p v-else class="text-sm text-text-muted mt-0.5">Selecciona los productos, captura cantidades y ajusta el precio de venta si aplica.</p>
        </div>

        <div v-if="loadingConversion" class="text-text-muted text-sm">Cargando presupuesto…</div>

        <!-- Error bloqueante de /convert (cotización ya convertida, o variantes que
		     ya no están en inventario): aquí sí
		     se oculta el form a propósito, no hay nada que se pueda registrar. -->
        <div v-else-if="conversionError" class="space-y-3">
            <p class="text-danger text-sm flex items-center gap-1.5 bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
                <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {{ conversionError }}
            </p>
            <router-link
                :to="{ name: 'quotes.show', params: { id: quoteId } }"
                class="inline-flex items-center bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none"
            >
                Volver al presupuesto
            </router-link>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Sección 1 — Cliente -->
            <div class="bg-surface border border-border rounded-md p-5 sm:p-6">
                <h2 class="text-xs font-medium uppercase tracking-wide text-text-muted mb-4">Cliente</h2>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                        <FieldLabel html-for="customer_id" text="Cliente" />
                        <CustomerSearch id="customer_id" v-model="form.customer_id" />
                    </div>
                </div>
            </div>

            <!-- Sección 2 — Líneas de venta -->
            <div class="bg-surface border border-border rounded-md p-5 sm:p-6">
                <h2 class="text-xs font-medium uppercase tracking-wide text-text-muted mb-4">Productos</h2>

                <DocumentLinesTable
                    v-model:lines="lines"
                    :submit-attempted="submitAttempted"
                    action="vender"
                    price-required
                    :line-subtotal="lineSubtotal"
                    :empty-line-fields="{ unit_price: null }"
                    @select="setListPrice"
                    @price-type-change="setListPrice"
                >
                    <template #price="{ row }">
                        <div class="space-y-1.5 sm:space-y-0">
                            <FieldLabel
                                :html-for="`unit-price-${row.id}`"
                                :text="row.variant ? `Precio unitario (${isPieceLine(row) ? 'pieza' : 'm²'})` : 'Precio unitario'"
                                required
                                class="sm:sr-only"
                            />
                            <InputNumberCustom
                                :id="`unit-price-${row.id}`"
                                v-model="row.unit_price"
                                :min="0"
                                placeholder="$0.00"
                                mode="currency"
                                currency="MXN"
                                :error="priceError(row)"
                            />
                            <p v-if="priceError(row)" class="text-danger text-xs mt-1.5">{{ priceError(row) }}</p>
                            <template v-else>
                                <!-- Lo que vale cada caja al precio capturado -->
                                <p v-if="boxPrice(row) !== null" class="text-xs text-text-muted mt-1 tabular-nums">
                                    {{ formatCurrency(boxPrice(row)) }}/caja
                                </p>
                                <!-- Referencia solo si el precio se ajustó: hace visible un descuento
                                     o un error de dedo antes de registrar -->
                                <p v-if="priceDiffersFromList(row)" class="text-xs text-text-muted mt-0.5 tabular-nums">
                                    Lista: {{ formatCurrency(listPrice(row)) }}{{ row.variant ? (isPieceLine(row) ? '/pieza' : '/m²') : '' }}
                                </p>
                            </template>
                        </div>
                    </template>

                    <!-- danger, no amber como en Cotizaciones: aquí el backend sí rechaza la venta -->
                    <template #stock-alert="{ row }">
                        <p
                            v-if="hasProduct(row) && hasInsufficientStock(row)"
                            class="mt-2 sm:mr-10 flex items-start gap-1.5 text-xs text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2"
                        >
                            <i class="ti ti-alert-triangle text-sm leading-none" aria-hidden="true"></i>
                            <span>{{ stockError(row) }}</span>
                        </p>
                    </template>
                </DocumentLinesTable>

                <div class="flex justify-end mt-5 pt-4 border-t border-border">
                    <div class="w-full sm:w-64 space-y-1.5">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-text-muted">Subtotal</span>
                            <span class="text-text">{{ formatCurrency(subtotal) }}</span>
                        </div>
                        <div class="flex items-center justify-between text-sm font-medium">
                            <span class="text-text">Total</span>
                            <span class="text-text">{{ formatCurrency(total) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <SaleSummaryBar
                :error="generalError"
                :product-count="productCount"
                :total="total"
                :quote-id="quoteId"
                :can-clear="isDirty"
                :submitting="submitting"
                @clear="requestClear"
            />
        </form>

        <ConfirmDialog :pt="{ mask: { class: 'bg-primary/50' } }">
            <template #container="{ message, acceptCallback, rejectCallback }">
                <div class="bg-surface border border-border rounded-md p-5 w-[380px] max-w-[90vw]">
                    <h3 class="font-serif text-base text-primary mb-2">{{ message.header }}</h3>
                    <p class="text-sm text-text-muted mb-5">{{ message.message }}</p>
                    <div class="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            @click="rejectCallback"
                            class="bg-surface border border-border hover:bg-bg text-text font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                        >
                            Seguir editando
                        </button>
                        <button
                            type="button"
                            @click="acceptCallback"
                            class="bg-danger hover:bg-danger/90 text-white font-medium text-sm h-10 px-4 rounded-md transition-colors select-none cursor-pointer"
                        >
                            Descartar venta
                        </button>
                    </div>
                </div>
            </template>
        </ConfirmDialog>
    </div>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import axios from '@/lib/axios'
import { useInventoryStore } from '@/stores/inventory'
import { useSimpleProductsStore } from '@/stores/simpleProducts'
import { useCatalogsStore } from '@/stores/catalogs'
import { useSalesStore } from '@/stores/sales'
import { useQuotesStore } from '@/stores/quotes'
import CustomerSearch from '@/components/widgets/autocompletes/CustomerSearch.vue'
import DocumentLinesTable from '@/components/widgets/tables/DocumentLinesTable.vue'
import InputNumberCustom from '@/components/widgets/InputNumberCustom.vue'
import FieldLabel from '@/components/widgets/labels/FieldLabel.vue'
import { useNotify } from '@/composables/useNotify'
import { formatCurrency } from '@/lib/formatCurrency'
import { useLineProducts } from '@/composables/useLineProducts'
import * as documentLines from '@/lib/documentLines'
import { hasProduct, lineItemPayload, serializeLines } from '@/lib/documentLines'
import {
    findVariant,
    missingProductsMessage,
    resolveConversionLines,
    simpleProductStockAfterSale,
    variantStockAfterSale,
} from '@/lib/saleForm'
import SaleSummaryBar from './components/SaleSummaryBar.vue'

const route = useRoute()
const router = useRouter()
const sales = useSalesStore()
const quotes = useQuotesStore()
const inventory = useInventoryStore()
const simpleProducts = useSimpleProductsStore()
const catalogs = useCatalogsStore()
const notify = useNotify()
const confirm = useConfirm()
const { isPieceLine, simpleProductFor, linePriceType } = useLineProducts()

// Precio de lista, stock y categoría de las líneas simples salen de estos
// stores (cacheados vía `initialized`); ProductAutocomplete también los carga,
// el guard de `loading` evita el request duplicado.
if (!simpleProducts.initialized && !simpleProducts.loading) simpleProducts.fetchSimpleProducts()
if (!catalogs.initialized && !catalogs.loading) catalogs.fetchCatalogs()

const form = reactive({
    customer_id: '',
})

// Con ?quote_id= es "Convertir a venta": se prellena desde GET /quotes/{id}/convert
// y la confirmación pasa por el mismo POST /api/sales con quote_id en el payload.
// Sin él es venta directa de mostrador.
const quoteId = computed(() => route.query.quote_id ?? null)
const loadingConversion = ref(false)
const conversionError = ref(null)

async function loadConversion() {
    loadingConversion.value = true

    try {
        const { data } = await axios.get(`/api/quotes/${quoteId.value}/convert`)

        // /convert solo trae product_variant_id o simple_product_id (arco
        // exclusivo); el producto completo se resuelve contra su propio caché —
        // variantes contra inventory.products, simples contra simpleProducts —
        // con la misma forma que emite ProductAutocomplete (ver también
        // QuoteFormView@loadQuote). Cada store se carga solo si hay líneas de su tipo.
        const items = data.data.items ?? []
        const hasVariantItems = items.some((item) => item.product_variant_id)
        const hasSimpleItems = items.some((item) => item.simple_product_id)

        let inventoryIsFresh = false
        if (hasVariantItems && !inventory.initialized) {
            await inventory.fetchProducts()
            inventoryIsFresh = true
        }
        if (hasVariantItems && !inventory.initialized) {
            conversionError.value = inventory.error || 'No se pudieron cargar los productos.'
            return
        }

        let simpleProductsAreFresh = false
        if (hasSimpleItems && !simpleProducts.initialized) {
            await simpleProducts.fetchSimpleProducts()
            simpleProductsAreFresh = true
        }
        if (hasSimpleItems && !simpleProducts.initialized) {
            conversionError.value = simpleProducts.error || 'No se pudieron cargar los productos.'
            return
        }

        let resolved = resolveConversionLinesFromCache(items)

        // Respaldo: los productos dados de baja ya los rechaza el backend con 422.
        // Esto cubre uno que existe en BD pero no en el caché (ej. creado después
        // de cargar el store): se refresca ese store una sola vez (salvo que se
        // acabe de cargar) y se reintenta.
        const refetches = []
        if (resolved.missingVariantIds.length > 0 && !inventoryIsFresh) refetches.push(inventory.fetchProducts())
        if (resolved.missingSimpleProductIds.length > 0 && !simpleProductsAreFresh) refetches.push(simpleProducts.fetchSimpleProducts())
        if (refetches.length > 0) {
            await Promise.all(refetches)
            resolved = resolveConversionLinesFromCache(items)
        }

        const { loadedLines, missingVariantIds, missingSimpleProductIds } = resolved

        // Si aun así falta, se bloquea.
        if (missingVariantIds.length > 0 || missingSimpleProductIds.length > 0) {
            conversionError.value = missingProductsMessage(missingVariantIds, missingSimpleProductIds)
            return
        }

        form.customer_id = data.data.customer_id ?? ''
        lines.value = loadedLines.length > 0 ? loadedLines : [createEmptyLine()]
        // Lo prellenado desde la cotización no cuenta como cambio; solo lo que
        // se ajuste después.
        savedSnapshot.value = serializeForm()
    } catch (err) {
        console.error(err)
        // 422 de QuoteController@convert (cotización ya convertida, o variantes
        // dadas de baja): el mensaje ya viene listo y se muestra tal cual.
        conversionError.value = err.response?.status === 404
            ? 'El presupuesto no existe.'
            : err.response?.data?.message || 'No se pudo cargar el presupuesto.'
    } finally {
        loadingConversion.value = false
    }
}

function resolveConversionLinesFromCache(items) {
    return resolveConversionLines(items, {
        products: inventory.products,
        simpleProducts: simpleProducts.simpleProducts,
        createLine: createEmptyLine,
    })
}

// En venta cada línea lleva además su precio, capturable (ver setListPrice).
function createEmptyLine() {
    return documentLines.createEmptyLine({ unit_price: null })
}

const lines = ref([createEmptyLine()])

// Cambios sin registrar (mismo patrón que QuoteFormView): se compara contra una
// foto del form tomada al iniciar, al terminar de prellenar una conversión y
// al limpiar tras registrar. Solo cuenta lo que se envía al backend; una línea
// vacía agregada y sin usar no es un cambio.
function serializeForm() {
    return JSON.stringify({
        customer_id: form.customer_id || null,
        lines: serializeLines(lines.value, { withPrice: true }),
    })
}

const savedSnapshot = ref(serializeForm())
const isDirty = computed(() => serializeForm() !== savedSnapshot.value)
// Tras registrar se navega al detalle de la venta sin pasar por la confirmación.
let skipLeaveGuard = false

function confirmDiscard() {
    if (skipLeaveGuard || !isDirty.value) return true

    return new Promise((resolve) => {
        confirm.require({
            header: 'Descartar venta',
            message: 'Hay una venta capturada sin registrar. Si sales ahora, se perderá.',
            accept: () => resolve(true),
            reject: () => resolve(false),
            onHide: () => resolve(false),
        })
    })
}

onBeforeRouteLeave(confirmDiscard)
// Mismo componente con otro query (ej. de "Convertir a venta" a "Nueva venta"
// desde el sidebar): no es un leave, pero el watch de quoteId limpia el form.
onBeforeRouteUpdate(confirmDiscard)

// Cerrar/recargar la pestaña no pasa por el router: el navegador muestra su
// propio aviso genérico (no se puede personalizar el texto).
function handleBeforeUnload(event) {
    if (!isDirty.value) return
    event.preventDefault()
    event.returnValue = ''
}

window.addEventListener('beforeunload', handleBeforeUnload)
onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload))

// En venta el backend sí acepta unit_price del cliente: al elegir un producto
// (no al fusionarlo con una línea existente, que conserva su precio) se precarga
// con el precio de lista (por m², por pieza o por unidad) como valor inicial editable.
// Igual al cambiar entre menudeo y mayoreo: se precarga el precio de ese tipo.
function setListPrice(row) {
    row.unit_price = listPrice(row)
}

// Las reglas de cada línea viven en lib/documentLines.js; aquí solo se les pasa
// lo que depende de los stores (si es por pieza, el producto simple y el stock "en vivo").
function hasInsufficientStock(row) {
    return documentLines.exceedsStock(row, lineStock(row))
}

function lineStock(row) {
    return row.simpleProduct ? documentLines.toStock(simpleProductFor(row).stock_quantity) : variantStock(row)
}

// Stock "en vivo" desde el store de Inventario: la variante de la línea es una
// copia tomada al elegirla, y no se entera de un refetch (ver refreshStock). Sin
// `??` entre ambas: un null en el store es "sin control", no "dato faltante".
function variantStock(row) {
    const live = findInventoryVariant(row.variant.id)
    return documentLines.toStock(live ? live.stock_boxes : row.variant.stock_boxes)
}

// Mismo texto base que el aviso de QuoteFormView, pero como error: el backend
// rechaza la venta completa si alguna línea excede el stock.
function stockError(row) {
    return documentLines.stockShortageMessage(row, lineStock(row), isPieceLine(row), {
        verb: 'requieren',
        consequence: 'La venta no podrá registrarse con esta cantidad.',
    })
}

// El mismo con el que se precarga unit_price al elegir el producto.
function listPrice(row) {
    return documentLines.listPrice(row, isPieceLine(row), row.simpleProduct ? simpleProductFor(row) : null)
}

// Comparado en centavos para no marcar diferencias de punto flotante.
function priceDiffersFromList(row) {
    if (!hasProduct(row) || !(row.unit_price > 0)) return false
    return Math.round(row.unit_price * 100) !== Math.round(listPrice(row) * 100)
}

// En venta el precio se captura: la caja y el subtotal salen de unit_price.
function boxPrice(row) {
    return documentLines.boxPrice(row, isPieceLine(row), row.unit_price)
}

function lineSubtotal(row) {
    return documentLines.lineSubtotal(row, isPieceLine(row), row.unit_price)
}

const subtotal = computed(() => lines.value.reduce((sum, row) => sum + lineSubtotal(row), 0))
const total = computed(() => subtotal.value) // sin impuestos por ahora, igual que Cotizaciones
const productCount = computed(() => lines.value.filter(hasProduct).length)

const submitting = ref(false)
const generalError = ref(null)

// Se activa en el primer intento de registrar; desde ahí los errores de cada
// línea se evalúan en vivo y desaparecen en cuanto se captura un valor válido
// (mismo criterio que QuoteFormView).
const submitAttempted = ref(false)

// La tabla muestra estos mismos errores por línea; aquí deciden si se puede registrar.
function quantityError(row) {
    return documentLines.missingQuantityMessage(row, isPieceLine(row))
}

function boxConversionError(row) {
    return documentLines.boxConversionError(row, isPieceLine(row), 'vender')
}

// StoreSaleRequest exige unit_price >= 0.01; sin esto el 422 llegaba como un
// mensaje genérico sin señalar la línea.
function priceError(row) {
    if (!submitAttempted.value || !hasProduct(row) || row.unit_price > 0) return ''
    return 'Captura el precio.'
}

// Mutación puntual in-place (sin refetch, ver AGENT.md). Si un store no está
// cargado no hay nada que sincronizar.
function syncStock(items) {
    if (inventory.initialized) {
        for (const { variantId, ...stock } of variantStockAfterSale(items, inventory.products)) {
            inventory.updateVariantStock(variantId, stock)
        }
    }
    if (simpleProducts.initialized) {
        for (const { productId, ...stock } of simpleProductStockAfterSale(items, simpleProducts.simpleProducts)) {
            simpleProducts.updateSimpleProductStock(productId, stock)
        }
    }
}

function findInventoryVariant(variantId) {
    return findVariant(inventory.products, variantId)?.variant ?? null
}

// Refetch puntual, una sola vez por intento fallido (nunca en loop). Solo los
// stores de los tipos presentes en el form.
function refreshStock() {
    if (lines.value.some((l) => l.variant)) inventory.fetchProducts()
    if (lines.value.some((l) => l.simpleProduct)) simpleProducts.fetchSimpleProducts()
}

function resetForm() {
    form.customer_id = ''
    lines.value = [createEmptyLine()]
    submitAttempted.value = false
    savedSnapshot.value = serializeForm()
}

// Limpiar no navega, así que no pasa por la confirmación de salida: pide la
// suya (solo se habilita con cambios, ver isDirty).
function requestClear() {
    confirm.require({
        header: 'Limpiar venta',
        message: 'Se quitarán el cliente y los productos capturados.',
        accept: () => {
            generalError.value = null
            resetForm()
        },
    })
}

const handleSubmit = async () => {
    generalError.value = null
    submitAttempted.value = true

    // Una línea con producto pero sin cantidad o precio bloquea el registro (antes
    // se descartaba en silencio). Las líneas sin producto sí se ignoran: son filas
    // agregadas con "+ Agregar producto" que no se llegaron a usar.
    if (lines.value.some((l) => quantityError(l) || priceError(l))) {
        generalError.value = 'Hay productos sin cantidad o precio. Captúralos o quita la línea.'
        return
    }

    if (lines.value.some((l) => boxConversionError(l))) {
        generalError.value = 'Hay variantes sin m² por caja configurado. Quítalas o corrígelas en Inventario.'
        return
    }

    const validLines = lines.value.filter(hasProduct)
    if (validLines.length === 0) {
        generalError.value = 'Agrega al menos un producto con cantidad mayor a cero.'
        return
    }

    submitting.value = true

    try {
        const payload = {
            customer_id: form.customer_id || null,
            ...(quoteId.value ? { quote_id: Number(quoteId.value) } : {}),
            items: validLines.map((l) => ({ ...lineItemPayload(l, linePriceType(l)), unit_price: l.unit_price })),
        }

        const sale = await sales.createSale(payload)
        syncStock(payload.items)

        // El listado de cotizaciones cacheado no se refetchea: el status se
        // actualiza in-place.
        if (quoteId.value) quotes.markQuoteConverted(quoteId.value)

        // Venta directa y conversión van al detalle de la venta (no se limpia el
        // form ni se vuelve a la cotización): lo siguiente es entregar la nota,
        // y PDF/Compartir viven ahí. El detalle ofrece "Nueva venta" para el
        // siguiente cliente y enlaza de vuelta a la cotización de origen.
        skipLeaveGuard = true
        notify.success(
            `Venta ${sale.folio} registrada`,
            quoteId.value ? 'El presupuesto quedó en estado Convertida.' : undefined,
        )
        router.push({ name: 'pos.sales.show', params: { id: sale.id } })
    } catch (err) {
        console.error(err)
        // 422 del backend (stock insuficiente, variante sin m2_per_box, cantidad
        // fraccionaria en un producto simple, o validación del Form Request) ya
        // trae un mensaje listo para mostrar.
        generalError.value = err.response?.data?.message || 'No se pudo registrar la venta. Intenta de nuevo.'

        // Un 422 de negocio (sin `errors` de Form Request) puede venir de stock que
        // cambió con el form abierto (otra venta, un ajuste): se refresca una vez
        // para que el aviso por línea muestre lo disponible real.
        if (err.response?.status === 422 && !err.response.data?.errors) refreshStock()
    } finally {
        submitting.value = false
    }
}

// Al final del script: con `immediate` corre en setup y necesita que lines,
// generalError, etc. ya estén declarados.
watch(quoteId, () => {
    conversionError.value = null
    generalError.value = null
    resetForm()
    if (quoteId.value) loadConversion()
}, { immediate: true })
</script>

<style scoped>

</style>
