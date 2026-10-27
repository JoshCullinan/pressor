/**
 * Parse what the clinician typed into a number field.
 * Returns `undefined` for blank, `NaN` for anything that isn't a plain number, and the number otherwise.
 * A decimal comma is accepted because that is how many South African keyboards type it.
 */
export function parseNumber(text: string): number | undefined {
  const t = text.trim().replace(',', '.');
  if (t === '') return undefined;
  if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
  return Number(t);
}

/** Keep only characters a number field can hold, so pasted junk never reaches the maths. */
export function sanitizeNumberInput(text: string): string {
  return text.replace(/[^0-9.,]/g, '');
}
