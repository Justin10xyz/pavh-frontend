const quantityFormatter = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 })

// Cantidades en m² o unidades: hasta 2 decimales, sin ceros de relleno. Acepta
// números o los strings decimales que serializa Laravel; un valor vacío o no
// numérico se muestra como 0, igual que formatCurrency.
export function formatQuantity(value) {
	return quantityFormatter.format(Number(value) || 0)
}
