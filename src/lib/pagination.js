// Opciones de "Por página" de PaginatorCustom y lectura de ?pagina= / ?por_pagina=
// de la URL. Un valor inválido o fuera de las opciones cae al default.
export const ROWS_PER_PAGE_OPTIONS = [20, 50, 100]
export const DEFAULT_ROWS_PER_PAGE = 20

export function parsePageQuery(value) {
    const page = Number(value)
    return Number.isInteger(page) && page > 0 ? page : 1
}

export function parseRowsQuery(value) {
    const rows = Number(value)
    return ROWS_PER_PAGE_OPTIONS.includes(rows) ? rows : DEFAULT_ROWS_PER_PAGE
}

// Solo los params distintos del default, para no ensuciar la URL en la página 1.
export function paginationQuery(page, rows) {
    return {
        ...(page > 1 ? { pagina: String(page) } : {}),
        ...(rows !== DEFAULT_ROWS_PER_PAGE ? { por_pagina: String(rows) } : {}),
    }
}
