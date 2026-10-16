// Hooks de <Transition name="collapse"> para abrir/cerrar con altura animada: se
// anima de 0 a la altura real del contenido (y al revés), y al terminar se
// suelta para que vuelva a ser auto. Las clases `.collapse-*` (opacidad y
// duración) van en el CSS de cada componente que lo usa.

export function onCollapseEnter(el) {
    el.style.height = "0px";
    void el.offsetHeight;
    el.style.height = `${el.scrollHeight}px`;
}

export function onCollapseLeave(el) {
    el.style.height = `${el.scrollHeight}px`;
    void el.offsetHeight;
    el.style.height = "0px";
}

export function clearCollapseHeight(el) {
    el.style.height = "";
}
