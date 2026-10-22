// Texto de specs de una variante de piso, compartido por Inventario (catálogo y
// form) y las líneas de cotización/venta.

// Caras: 0 = la caja es pareja. Vacío/null devuelve "" (no se muestra nada).
export function formatFaceCount(faceCount) {
    if (faceCount === null || faceCount === undefined || faceCount === "") return "";
    const count = Number(faceCount);
    if (count === 0) return "Sin variación";
    return `${count} ${count === 1 ? "cara" : "caras"}`;
}
