import { defineStore } from "pinia";
import axios from "@/lib/axios";

// Comprobantes Fiscales Simplificados. Por ahora solo la creación (conversión
// desde una cotización pagada); sin listado todavía, así que no hay estado ni
// flag `initialized`.
export const useComprobantesStore = defineStore("comprobantes", () => {
    // POST /api/comprobantes solo recibe quote_id y la fecha (opcional, hoy si
    // no llega): líneas, montos, folio y total con letra se copian/generan
    // server-side. Responde 422 si la cotización no está pagada o ya tiene
    // comprobante.
    async function createComprobante(payload) {
        const { data } = await axios.post("/api/comprobantes", payload);
        return data.data;
    }

    return {
        createComprobante,
    };
});
