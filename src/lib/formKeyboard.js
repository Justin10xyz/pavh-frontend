// Captura sin mouse en los formularios de producto: Enter avanza al siguiente
// campo (como Tab, pero sin pasar por botones) en vez de enviar el form. Los
// handlers van en el <form>: `@keydown.capture="advanceSelectOnEnter"` y
// `@keydown="advanceOnEnter"`.

// Inputs de texto/número y el elemento enfocable de los Select de PrimeVue
// (`role="combobox"`). Los ocultos con v-if no están en el DOM.
const FIELD_SELECTOR = [
    'input:not([type="hidden"]):not([type="checkbox"]):not(:disabled)',
    '[role="combobox"]:not([aria-disabled="true"])',
].join(", ");

function isEnter(event) {
    return (
        event.key === "Enter" && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey
    );
}

function focusNextField(form, current) {
    const fields = [...form.querySelectorAll(FIELD_SELECTOR)];
    const next = fields[fields.indexOf(current) + 1];
    if (!next) return;
    next.focus();
    // Igual que DocumentLinesTable: el valor queda seleccionado para sobrescribirlo.
    if (next instanceof HTMLInputElement) next.select();
}

// Fase de captura, antes que el Select: con la lista cerrada, Enter avanza en
// vez de abrirla (se abre con ↓, Espacio o escribiendo una letra). Con la lista
// abierta, Enter sigue eligiendo la opción.
export function advanceSelectOnEnter(event) {
    const target = event.target;
    if (!isEnter(event) || target.getAttribute("role") !== "combobox") return;
    if (target.getAttribute("aria-expanded") === "true") return;

    event.preventDefault();
    event.stopPropagation();
    focusNextField(event.currentTarget, target);
}

// Fase de burbuja: un componente que ya resolvió el Enter (ej. agregar un color
// en VariantColorsTable) lo marca con preventDefault y aquí se respeta. En el
// último campo Enter no hace nada: el form se guarda con su botón o su atajo.
export function advanceOnEnter(event) {
    if (!isEnter(event) || event.defaultPrevented) return;
    if (!(event.target instanceof HTMLInputElement)) return;

    event.preventDefault();
    focusNextField(event.currentTarget, event.target);
}
