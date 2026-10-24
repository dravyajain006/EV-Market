import { describe, it, expect } from 'vitest';
import {
  calculateEvPenetration,
  calculateYoyGrowth,
  calculateMarketShare,
  calculateDataCompleteness,
} from '../src/utils/formulas.js';

describe('Business Logic Formulas Unit Tests', () => {
  describe('calculateEvPenetration', () => {
    it('should accurately compute penetration rate percentage', () => {
      // 100 EVs out of 1000 total vehicles = 10.0%
      expect(calculateEvPenetration(100, 1000)).toBe(10.0);
      // Real-world sample: 41,200 EVs out of 565,000 vehicles = 7.29%
      expect(calculateEvPenetration(41200, 565000)).toBe(7.29);
    });

    it('should safely return 0.0% when total vehicle denominator is zero or missing', () => {
      expect(calculateEvPenetration(100, 0)).toBe(0.0);
      expect(calculateEvPenetration(100, -50)).toBe(0.0);
      expect(calculateEvPenetration(100, NaN)).toBe(0.0);
    });

    it('should clamp values between 0.0% and 100.0%', () => {
      expect(calculateEvPenetration(-50, 1000)).toBe(0.0);
      expect(calculateEvPenetration(1500, 1000)).toBe(100.0);
    });
  });

  describe('calculateYoyGrowth', () => {
    it('should accurately compute positive and negative YoY percentage growth', () => {
      // 150 current vs 100 previous = +50.0%
      expect(calculateYoyGrowth(150, 100)).toBe(50.0);
      // 80 current vs 100 previous = -20.0%
      expect(calculateYoyGrowth(80, 100)).toBe(-20.0);
    });

    it('should return null when previous period value is 0, null, or undefined', () => {
      expect(calculateYoyGrowth(100, 0)).toBeNull();
      expect(calculateYoyGrowth(100, null)).toBeNull();
      expect(calculateYoyGrowth(100, undefined)).toBeNull();
      expect(calculateYoyGrowth(100, -10)).toBeNull();
    });
  });

  describe('calculateMarketShare', () => {
    it('should compute OEM market share within segment', () => {
      // Tata Motors 71,400 out of 104,700 4W EVs = 68.1948% -> 68.19%
      expect(calculateMarketShare(71400, 104700)).toBe(68.19);
    });

    it('should handle empty market denominator gracefully', () => {
      expect(calculateMarketShare(500, 0)).toBe(0.0);
    });
  });

  describe('calculateDataCompleteness', () => {
    it('should compute completeness index percentage', () => {
      expect(calculateDataCompleteness(95, 100)).toBe(95.0);
      expect(calculateDataCompleteness(200, 200)).toBe(100.0);
      expect(calculateDataCompleteness(0, 0)).toBe(0.0);
    });
  });
});
