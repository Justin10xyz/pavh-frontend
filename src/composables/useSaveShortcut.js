import { onMounted, onUnmounted } from 'vue'

// Ctrl+S / Ctrl+Enter (⌘ en Mac) envían el form, para guardar sin buscar el
// botón con el mouse. Ctrl+S se intercepta en toda la vista para que el
// navegador no abra "Guardar página como"; solo envía si el foco está en el
// form o en ningún lado, así un diálogo abierto encima (ej. "Nuevo proveedor")
// no guarda el producto de fondo. `requestSubmit()` pasa por el @submit del
// form (validación incluida); `canSubmit` evita un doble envío mientras guarda.
export function useSaveShortcut(formRef, canSubmit = () => true) {
    const isMac = /mac/i.test(navigator.userAgentData?.platform ?? navigator.platform)
    const modifierLabel = isMac ? '⌘' : 'Ctrl'
    // Para el `aria-keyshortcuts` del botón de guardar.
    const ariaKeyshortcuts = isMac ? 'Meta+S Meta+Enter' : 'Control+S Control+Enter'

    function onKeydown(event) {
        if (!(isMac ? event.metaKey : event.ctrlKey) || event.altKey || event.shiftKey) return

        const isSave = event.key.toLowerCase() === 's'
        if (!isSave && event.key !== 'Enter') return
        if (isSave) event.preventDefault()

        const form = formRef.value
        const target = event.target
        const inForm = form?.contains(target) || target === document.body
        if (!inForm) return

        event.preventDefault()
        if (event.repeat || !canSubmit()) return
        form.requestSubmit()
    }

    onMounted(() => window.addEventListener('keydown', onKeydown))
    onUnmounted(() => window.removeEventListener('keydown', onKeydown))

    return { modifierLabel, ariaKeyshortcuts }
}
