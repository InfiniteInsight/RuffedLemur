// src/app/shared/utils/type-guard.spec.ts

import { isStringId, isNumberId, idToString, idToNumber } from './type-guard';

describe('Type Guards', () => {
  describe('isStringId', () => {
    it('should return true for string IDs', () => {
      expect(isStringId('abc123')).toBeTrue();
      expect(isStringId('123')).toBeTrue();
      expect(isStringId('')).toBeTrue();
    });

    it('should return false for number IDs', () => {
      expect(isStringId(123)).toBeFalse();
      expect(isStringId(0)).toBeFalse();
      expect(isStringId(-1)).toBeFalse();
    });
  });

  describe('isNumberId', () => {
    it('should return true for number IDs', () => {
      expect(isNumberId(123)).toBeTrue();
      expect(isNumberId(0)).toBeTrue();
      expect(isNumberId(-1)).toBeTrue();
    });

    it('should return false for string IDs', () => {
      expect(isNumberId('abc123')).toBeFalse();
      expect(isNumberId('123')).toBeFalse();
      expect(isNumberId('')).toBeFalse();
    });
  });

  describe('idToString', () => {
    it('should convert number IDs to strings', () => {
      expect(idToString(123)).toBe('123');
      expect(idToString(0)).toBe('0');
      expect(idToString(-1)).toBe('-1');
    });

    it('should return string IDs unchanged', () => {
      expect(idToString('abc123')).toBe('abc123');
      expect(idToString('123')).toBe('123');
      expect(idToString('')).toBe('');
    });
  });

  describe('idToNumber', () => {
    it('should convert string IDs to numbers', () => {
      expect(idToNumber('123')).toBe(123);
      expect(idToNumber('0')).toBe(0);
      expect(idToNumber('-1')).toBe(-1);
    });

    it('should return number IDs unchanged', () => {
      expect(idToNumber(123)).toBe(123);
      expect(idToNumber(0)).toBe(0);
      expect(idToNumber(-1)).toBe(-1);
    });

    it('should return NaN for non-numeric string IDs', () => {
      expect(idToNumber('abc123')).toBeNaN();
      expect(idToNumber('')).toBeNaN();
    });
  });
});
