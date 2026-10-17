import { computed } from "vue";
import { useInventoryStore } from "@/stores/inventory";
import { useSimpleProductsStore } from "@/stores/simpleProducts";
import { useCatalogsStore } from "@/stores/catalogs";
import { pieceVariantIds } from "@/lib/unitTypes";
import { hasWholesalePrice, linePriceType as resolveLinePriceType } from "@/lib/documentLines";

// Datos de las líneas de un documento (cotización o venta) que dependen de los
// stores: si la variante se vende por pieza, su código de comisión y el producto
// simple "en vivo". Lo usan QuoteFormView, SaleFormView y DocumentLinesTable; las
// reglas puras de cada línea están en lib/documentLines.js.
export function useLineProducts() {
    const inventory = useInventoryStore();
    const simpleProducts = useSimpleProductsStore();
    const catalogs = useCatalogsStore();

    // Variantes de pisos por pieza (unit_type "pieza"): la cantidad son piezas,
    // que se mandan tal cual como `boxes`, al precio por pieza (price_per_box),
    // sin m². Se resuelve contra Inventario (de ahí salen las variantes del
    // buscador y de /convert); mientras carga, la línea se trata como por caja.
    const pieceVariantIdSet = computed(() => pieceVariantIds(inventory.products));

    function isPieceLine(line) {
        return !!line.variant && pieceVariantIdSet.value.has(line.variant.id);
    }

    const inventoryVariantsById = computed(
        () => new Map(inventory.products.flatMap((product) => (product.variants ?? []).map((v) => [v.id, v]))),
    );

    // Código de comisión de una línea de variante (null en simples o sin código).
    // Se lee de Inventario porque la variante de una cotización cargada para
    // editar no lo trae; si no está ahí, se usa el de la línea.
    function commissionCategoryFor(line) {
        if (!line.variant) return null;
        const live = inventoryVariantsById.value.get(line.variant.id);
        return (live ?? line.variant).commission_category ?? null;
    }

    function findSimpleProduct(simpleProductId) {
        return simpleProducts.simpleProducts.find((p) => p.id === simpleProductId) ?? null;
    }

    // Datos vivos del producto simple (precio, stock, categoría) desde el store;
    // si no está ahí (ej. dado de baja después de cotizar), se usa lo que trae la línea.
    function simpleProductFor(line) {
        return findSimpleProduct(line.simpleProduct.id) ?? line.simpleProduct;
    }

    function simpleProductCategoryName(line) {
        const categoryId = simpleProductFor(line).category_id;
        return catalogs.categories.find((c) => c.id === categoryId)?.name ?? "";
    }

    // Mayoreo disponible en una línea de producto simple (precio "en vivo").
    function hasWholesale(line) {
        return !!line.simpleProduct && hasWholesalePrice(simpleProductFor(line));
    }

    // Tipo de precio efectivo de la línea (ver documentLines.linePriceType).
    function linePriceType(line) {
        return resolveLinePriceType(line, line.simpleProduct ? simpleProductFor(line) : null);
    }

    return {
        isPieceLine,
        commissionCategoryFor,
        findSimpleProduct,
        simpleProductFor,
        simpleProductCategoryName,
        hasWholesale,
        linePriceType,
    };
}
