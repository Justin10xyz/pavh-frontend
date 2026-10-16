// Estado de stock de las variantes en el listado de Inventario (InventoryTable y
// VariantGroupPanel).

// `stock_boxes === null` = variante sin control de stock: ni "Stock bajo" ni "OK".
export function isTracked(variant) {
    return variant.stock_boxes !== null && variant.stock_boxes !== undefined;
}

// Cuenta sobre las variantes visibles (ya filtradas), igual que la columna Variantes.
export function lowStockCount(variants = []) {
    return variants.filter((v) => isTracked(v) && v.low_stock).length;
}

export function lowStockLabel(variants) {
    return `${lowStockCount(variants)} con stock bajo`;
}
