/**
 * Valida RUC peruano usando el algoritmo de dígito verificador de SUNAT.
 *
 * Factores: [5,4,3,2,7,6,5,4,3,2] para los 10 primeros dígitos.
 * Dígito verificador = 11 - (suma_ponderada mod 11)
 * Si el resultado es 10 → dígito = 1; si es 11 → dígito = 0; si no → resultado.
 */
export function validateRucCheckDigit(ruc: string): boolean {
  if (!/^\d{11}$/.test(ruc)) return false;
  const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digits = ruc.split('').map(Number);
  const sum = factors.reduce((acc, f, i) => acc + f * digits[i], 0);
  const rem = sum % 11;
  const check = rem === 0 ? 0 : rem === 1 ? 1 : 11 - rem;
  return check === digits[10];
}

export function validateRucFormat(ruc: string): { valid: boolean; reason?: string } {
  if (!/^\d{11}$/.test(ruc)) {
    return { valid: false, reason: 'El RUC debe tener exactamente 11 dígitos numéricos.' };
  }
  const first2 = parseInt(ruc.slice(0, 2));
  const validPrefixes = [10, 15, 16, 17, 20];
  if (!validPrefixes.some((p) => first2 === p)) {
    return { valid: false, reason: `Prefijo ${first2} no reconocido. Los RUCs válidos comienzan en 10, 15, 16, 17 o 20.` };
  }
  if (!validateRucCheckDigit(ruc)) {
    return { valid: false, reason: 'El dígito verificador del RUC es incorrecto.' };
  }
  return { valid: true };
}

export function validateDniFormat(dni: string): { valid: boolean; reason?: string } {
  if (!/^\d{8}$/.test(dni)) {
    return { valid: false, reason: 'El DNI debe tener exactamente 8 dígitos numéricos.' };
  }
  return { valid: true };
}
