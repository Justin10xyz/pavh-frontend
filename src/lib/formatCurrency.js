const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

// Acepta números o los strings decimales que serializa Laravel. Un valor vacío
// o no numérico (ej. una línea a medio capturar) se muestra como $0.00, no $NaN.
export function formatCurrency(value) {
	return currencyFormatter.format(Number(value) || 0)
}
