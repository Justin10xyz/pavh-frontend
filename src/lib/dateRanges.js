import { APP_TIMEZONE } from '@/lib/dates'

const todayPartsFormatter = new Intl.DateTimeFormat('en-US', {
	timeZone: APP_TIMEZONE,
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
})

// Día de calendario de hoy en la zona de la app, como Date a medianoche UTC: así
// "hoy" no depende de la zona del navegador y la aritmética de días se hace en UTC.
function todayInAppTimezone() {
	const parts = Object.fromEntries(
		todayPartsFormatter.formatToParts(new Date()).map(({ type, value }) => [type, Number(value)])
	)
	return new Date(Date.UTC(parts.year, parts.month - 1, parts.day))
}

// YYYY-MM-DD de un Date a medianoche UTC (ver todayInAppTimezone).
function toDateParam(date) {
	const y = date.getUTCFullYear()
	const m = String(date.getUTCMonth() + 1).padStart(2, '0')
	const d = String(date.getUTCDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

// Rangos de calendario terminando hoy; la semana empieza en lunes. Devuelve
// null para 'all' (sin filtro de fecha).
export function dateRangeFor(key) {
	const today = todayInAppTimezone()
	const to = toDateParam(today)

	if (key === 'today') return { from: to, to }

	if (key === 'week') {
		const monday = new Date(today)
		monday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7))
		return { from: toDateParam(monday), to }
	}

	if (key === 'month') {
		return { from: toDateParam(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))), to }
	}

	return null
}
