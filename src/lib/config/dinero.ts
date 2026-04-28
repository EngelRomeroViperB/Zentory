import DineroFactory from 'dinero.js';

// ═══════════════════════════════════════════════════════════════════
// Configuración centralizada de Dinero.js
// TODAS las operaciones monetarias deben importar desde este módulo.
// Cambiar locale/moneda AQUÍ afecta todo el sistema.
// ═══════════════════════════════════════════════════════════════════

// Configurar locale global una sola vez — formato colombiano
DineroFactory.globalLocale = 'es-CO';

export type DineroType = ReturnType<typeof DineroFactory>;

/**
 * Crea un Dinero desde un string monetario de la DB (ej: "15000.00").
 * Convierte a centavos internamente para evitar floating-point bugs.
 */
export function fromDBString(value: string | number): DineroType {
  const numeric = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numeric)) return DineroFactory({ amount: 0, currency: 'USD' });
  return DineroFactory({ amount: Math.round(numeric * 100), currency: 'USD' });
}

/**
 * Formatea un valor monetario (string o number) para mostrar en UI.
 * Ejemplo: "15000.50" → "$15,000.50"
 */
export function formatMoney(value: string | number): string {
  return fromDBString(value).toFormat('$0,0.00');
}

/**
 * Suma segura de un array de valores monetarios string.
 */
export function sumMoney(values: (string | number)[]): DineroType {
  return values.reduce<DineroType>(
    (acc, val) => acc.add(fromDBString(val)),
    DineroFactory({ amount: 0, currency: 'USD' })
  );
}

// Re-exportar el constructor para uso directo cuando se necesite
export { DineroFactory as Dinero };
