// Reglas del formulario de venta (SaleFormView.vue) que no son de las líneas en
// sí (esas están en lib/documentLines.js): prellenado desde una cotización y
// stock restante tras registrar. Solo funciones puras: las peticiones y las
// escrituras a los stores se quedan en la vista.

// Variante y su producto (la línea de piso) dentro de los productos de Inventario.
export function findVariant(products, variantId) {
    for (const product of products) {
        const variant = product.variants?.find((v) => v.id === variantId);
        if (variant) return { product, variant };
    }
    return null;
}

// Líneas del form a partir de los items de GET /quotes/{id}/convert, que solo
// traen product_variant_id o simple_product_id (arco exclusivo). El producto
// completo se resuelve contra los cachés de Inventario y de productos simples,
// con la misma forma que emite ProductAutocomplete. Los que no aparecen se
// devuelven aparte para que la vista decida (refetch o bloqueo).
export function resolveConversionLines(items, { products, simpleProducts, createLine }) {
    const loadedLines = [];
    const missingVariantIds = [];
    const missingSimpleProductIds = [];

    for (const item of items) {
        const line = {
            ...createLine(),
            // Variante: las cajas cotizadas (null en líneas previas al cambio a
            // cajas sin m2_per_box; se piden al registrar). Simple: unidades.
            quantity: item.product_variant_id ? item.boxes : Number(item.quantity),
            unit_price: Number(item.unit_price),
        };

        if (item.simple_product_id) {
            const simpleProduct = simpleProducts.find((p) => p.id === item.simple_product_id);
            if (!simpleProduct) {
                missingSimpleProductIds.push(item.simple_product_id);
                continue;
            }
            line.simpleProduct = { ...simpleProduct, type: "simple" };
        } else {
            const found = findVariant(products, item.product_variant_id);
            if (!found) {
                missingVariantIds.push(item.product_variant_id);
                continue;
            }
            line.variant = { ...found.variant, lineName: found.product.name, type: "variant" };
        }

        loadedLines.push(line);
    }

    return { loadedLines, missingVariantIds, missingSimpleProductIds };
}

// Solo aquí el mensaje se arma en el frontend, con el id porque /convert no
// trae más datos.
export function missingProductsMessage(variantIds, simpleProductIds) {
    const parts = [];

    if (variantIds.length > 0) {
        const ids = variantIds.map((id) => `#${id}`).join(", ");
        parts.push(variantIds.length === 1 ? `la variante ${ids}` : `las variantes ${ids}`);
    }
    if (simpleProductIds.length > 0) {
        const ids = simpleProductIds.map((id) => `#${id}`).join(", ");
        parts.push(simpleProductIds.length === 1 ? `el producto ${ids}` : `los productos ${ids}`);
    }

    const plural = variantIds.length + simpleProductIds.length > 1;
    const subject = parts.join(" y ");

    return `${subject.charAt(0).toUpperCase()}${subject.slice(1)} de esta cotización ya no ${plural ? "están disponibles" : "está disponible"} en inventario. No se puede convertir a venta.`;
}

// SaleResource no regresa el stock restante: se recalcula con el mismo criterio
// que SaleController@store (las cajas de cada línea, sumadas por variante) y la
// misma regla de low_stock que ProductVariantResource. Devuelve el stock final
// de cada variante afectada.
export function variantStockAfterSale(items, products) {
    const boxesNeededByVariant = new Map();
    const variantsById = new Map();

    for (const item of items) {
        if (!item.product_variant_id) continue;
        const variant = findVariant(products, item.product_variant_id)?.variant;
        // Sin control de stock: el backend no descuenta, aquí tampoco.
        if (!variant || variant.stock_boxes === null) continue;

        variantsById.set(variant.id, variant);
        boxesNeededByVariant.set(variant.id, (boxesNeededByVariant.get(variant.id) ?? 0) + item.boxes);
    }

    return [...boxesNeededByVariant].map(([variantId, boxesNeeded]) => {
        const variant = variantsById.get(variantId);
        const stockBoxes = Number(variant.stock_boxes) - boxesNeeded;
        const lowStock = variant.minimum_stock !== null && stockBoxes <= variant.minimum_stock;
        return { variantId, stock_boxes: stockBoxes, low_stock: lowStock };
    });
}

// Mismo criterio para productos simples, sin conversión de unidad: `quantity`
// ya es la unidad física (SaleController@store descuenta igual, agregando por
// producto).
export function simpleProductStockAfterSale(items, simpleProducts) {
    const unitsByProduct = new Map();
    for (const item of items) {
        if (!item.simple_product_id) continue;
        unitsByProduct.set(item.simple_product_id, (unitsByProduct.get(item.simple_product_id) ?? 0) + item.quantity);
    }

    return [...unitsByProduct].flatMap(([productId, units]) => {
        const product = simpleProducts.find((p) => p.id === productId);
        if (!product || product.stock_quantity === null) return [];
        return [{ productId, stock_quantity: Number(product.stock_quantity) - units }];
    });
}
