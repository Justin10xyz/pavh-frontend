// Status de cotización tal como los devuelve la API (quoteStatus.name), en el
// orden del ciclo de vida. Usado por el filtro rápido de QuotesView. Son los
// valores reales: filtros, comparaciones y el ?estado= de la URL usan estos.
export const QUOTE_STATUSES = ["Borrador", "Pagada", "Convertida", "Cancelada"];

// Texto visible del status. El documento se llama "presupuesto" (masculino)
// pero el backend guarda los nombres en femenino (de "cotización"), así que
// solo se traduce al mostrarlo. Un valor desconocido se muestra tal cual.
const STATUS_LABELS = {
    Borrador: "Borrador",
    Pagada: "Pagado",
    Convertida: "Convertido",
    Cancelada: "Cancelado",
};

export function statusLabel(status) {
    return STATUS_LABELS[status] ?? status;
}

// Clases del badge de status de cotización, compartidas entre el listado
// (QuotesView) y el detalle (QuoteDetailView) para que se vean idénticos.
// Pagada en azul y no verde: verde ya es "Convertido".
export function statusClasses(status) {
    if (status === "Pagada") return "bg-sky-100 border-sky-200 text-sky-700 font-semibold";
    if (status === "Convertida")
        return "bg-emerald-100 border-emerald-200 text-emerald-600 font-semibold";
    if (status === "Cancelada") return "bg-red-100 border-red-200 text-red-600 font-semibold";
    return "text-text-muted bg-gray-100 border-gray-300";
}
