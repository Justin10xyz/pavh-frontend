const currencyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

// Acepta números o los strings decimales que serializa Laravel.
export function formatCurrency(value) {
	return currencyFormatter.format(Number(value))
}
