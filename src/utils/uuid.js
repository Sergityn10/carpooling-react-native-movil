// YouConnext - Universal RFC 4122 UUID v4 Generator
// Utilizado para Idempotency-Key en retiros y operaciones financieras críticas

/**
 * Genera un identificador universal único UUID versión 4 compatible con RFC 4122.
 * Prioriza crypto.randomUUID() nativo y cuenta con respaldo robusto.
 * @returns {string} UUID v4 en formato xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID() {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    try {
      return globalThis.crypto.randomUUID();
    } catch {}
  }

  // Algoritmo estándar RFC 4122 versión 4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default generateUUID;
