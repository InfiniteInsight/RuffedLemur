// frontend/RuffedLemur/src/app/shared/utils/type-guards.ts
/**
 * Type guard to check if a certificate ID is a string
 * @param id The certificate ID to check
 * @returns True if the ID is a string
 */
export function isStringId(id: string | number): id is string {
  return typeof id === 'string';
}

/**
 * Type guard to check if a certificate ID is a number
 * @param id The certificate ID to check
 * @returns True if the ID is a number
 */
export function isNumberId(id: string | number): id is number {
  return typeof id === 'number';
}

/**
 * Converts any certificate ID to a string
 * @param id The certificate ID to convert
 * @returns The ID as a string
 */
export function idToString(id: string | number): string {
  return id.toString();
}

/**
 * Converts any certificate ID to a number
 * @param id The certificate ID to convert
 * @returns The ID as a number, or NaN if conversion fails
 */
export function idToNumber(id: string | number): number {
  if (isNumberId(id)) {
    return id;
  }
  return parseInt(id, 10);
}
