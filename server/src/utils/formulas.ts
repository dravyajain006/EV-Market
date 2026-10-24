/**
 * Business Logic Mathematical Formulas for EV Analytics
 * Evaluates EV Penetration, YoY Growth, Market Share, and Data Completeness
 */

/**
 * Calculates EV Penetration percentage.
 * Formula: (Eligible EV Registrations / Eligible Total Vehicle Registrations) * 100
 */
export function calculateEvPenetration(evCount: number, totalCount: number): number {
  if (!totalCount || totalCount <= 0 || isNaN(totalCount) || isNaN(evCount) || evCount < 0) {
    return 0.0;
  }
  const penetration = (evCount / totalCount) * 100;
  return Number(Math.min(100.0, Math.max(0.0, penetration)).toFixed(2));
}

/**
 * Calculates Year-over-Year (YoY) Growth rate.
 * Formula: ((Current Value - Previous Comparable Value) / Previous Comparable Value) * 100
 */
export function calculateYoyGrowth(currentVal: number, previousVal: number | null | undefined): number | null {
  if (previousVal === null || previousVal === undefined || isNaN(previousVal) || previousVal <= 0) {
    return null; // Baseline observation or invalid denominator
  }
  if (isNaN(currentVal)) {
    return null;
  }
  const growth = ((currentVal - previousVal) / previousVal) * 100;
  return Number(growth.toFixed(2));
}

/**
 * Calculates OEM Market Share percentage within segment/market.
 * Formula: (Manufacturer EV Registrations / Total EV Registrations in Same Segment) * 100
 */
export function calculateMarketShare(oemRegistrations: number, totalMarketRegistrations: number): number {
  if (!totalMarketRegistrations || totalMarketRegistrations <= 0 || isNaN(totalMarketRegistrations) || isNaN(oemRegistrations) || oemRegistrations < 0) {
    return 0.0;
  }
  const share = (oemRegistrations / totalMarketRegistrations) * 100;
  return Number(Math.min(100.0, Math.max(0.0, share)).toFixed(2));
}

/**
 * Calculates Data Completeness percentage.
 * Formula: (Valid Required Field Values / Total Expected Required Field Values) * 100
 */
export function calculateDataCompleteness(validFields: number, totalExpectedFields: number): number {
  if (!totalExpectedFields || totalExpectedFields <= 0 || isNaN(totalExpectedFields) || isNaN(validFields) || validFields < 0) {
    return 0.0;
  }
  const score = (validFields / totalExpectedFields) * 100;
  return Number(Math.min(100.0, Math.max(0.0, score)).toFixed(2));
}
