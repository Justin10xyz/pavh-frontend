// Fecha local en YYYY-MM-DD; toISOString() la convertiría a UTC y en la noche
// podría correrse al día siguiente.
export function toDateParam(date) {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

// Rangos de calendario terminando hoy; la semana empieza en lunes. Devuelve
// null para 'all' (sin filtro de fecha).
export function dateRangeFor(key) {
	const today = new Date()
	const to = toDateParam(today)

	if (key === 'today') return { from: to, to }

	if (key === 'week') {
		const monday = new Date(today)
		monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
		return { from: toDateParam(monday), to }
	}

	if (key === 'month') {
		return { from: toDateParam(new Date(today.getFullYear(), today.getMonth(), 1)), to }
	}

	return null
}
