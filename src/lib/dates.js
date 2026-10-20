// Zona explícita: las fechas se muestran en hora de la tienda aunque el navegador
// esté en otra zona. Debe coincidir con config/app.php del backend.
export const APP_TIMEZONE = 'America/Mexico_City'

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-MX', {
    timeZone: APP_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
})

// Acepta los ISO-8601 que manda Laravel (con offset o con Z). Sin valor se muestra
// un guion en vez de "31 dic 1969".
export function formatDate(value) {
    return value ? dateFormatter.format(new Date(value)) : '—'
}

export function formatDateTime(value) {
    return value ? dateTimeFormatter.format(new Date(value)) : '—'
}

// Fecha sin hora ("YYYY-MM-DD", ej. credit_due_date). Se formatea en UTC: con
// APP_TIMEZONE, new Date("2026-10-20") (medianoche UTC) caería el día anterior.
const dateOnlyFormatter = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
})

export function formatDateOnly(value) {
    return value ? dateOnlyFormatter.format(new Date(value)) : '—'
}
