export type UserRole = 'ADMIN' | 'ANALYST' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department?: string;
  createdAt?: string;
}

export interface KpiSummary {
  selectedYear: number;
  totalEvRegistrations: number;
  totalVehicleRegistrations: number;
  evPenetrationPct: number;
  previousYearEvRegistrations: number;
  yoyGrowthPct: number | null;
  totalReportingRegions: number;
  leadingManufacturer: {
    name: string;
    category: string;
    annualRegistrations: number;
    marketSharePct: number;
  } | null;
}

export interface ChargingInfraSummary {
  sanctionedStations: number;
  operationalStations: number;
  fastChargersDc: number;
  slowChargersAc: number;
  highwayCorridorChargers: number;
  overallCommissioningRate: number;
}

export interface CategoryShare {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  evRegistrations: number;
  sharePct: number;
}

export interface OverviewData {
  kpiSummary: KpiSummary;
  chargingInfra: ChargingInfraSummary;
  categoryDistribution: CategoryShare[];
  dataProvenance: {
    dataSource: string;
    lastUpdated: string;
    status: string;
  };
}

export interface TrendPoint {
  year: number;
  evRegistrations: number;
  totalVehicleRegistrations: number;
  evPenetrationPct: number;
  yoyGrowthPct: number | null;
}

export interface RegionData {
  regionId: string;
  stateCode: string;
  stateName: string;
  zone: string;
  capital?: string;
  year: number;
  evRegistrations: number;
  totalVehicleRegistrations: number;
  evPenetrationPct: number;
  chargingStations?: {
    operational: number;
    sanctioned: number;
    dcFast: number;
    acSlow: number;
    highwayCorridor: number;
    commissioningRatePct: number;
  } | null;
}

export interface ManufacturerData {
  id: string;
  manufacturerId: string;
  name: string;
  categoryCode: string;
  categoryName: string;
  originCountry: string;
  headquarters?: string;
  isIndianOEM: boolean;
  year: number;
  annualRegistrations: number;
  marketSharePct: number;
  nationalRank: number;
}

export interface GlobalDataPoint {
  id: string;
  region: string;
  year: number;
  powertrain: string;
  vehicleType: string;
  annualSalesThousands: number;
  stockThousands: number;
  evSalesSharePct: number;
}

export interface DatasetItem {
  id: string;
  name: string;
  description?: string;
  sourceUrl?: string;
  retrievalDate: string;
  fileType: string;
  rowCount: number;
  status: string;
  createdAt: string;
  qualityReports?: {
    completenessScore: number;
    duplicateCount: number;
    missingValueCount: number;
    validationScore: number;
    summary?: string;
  }[];
  importJobs?: {
    id: string;
    fileName: string;
    status: string;
    totalRows: number;
    validRows: number;
    errorRows: number;
  }[];
}

export interface ForecastModelData {
  id: string;
  targetMetric: string;
  algorithm: string;
  trainingStartYear: number;
  trainingEndYear: number;
  forecastHorizonYears: number;
  mae: number;
  rmse: number;
  mape: number;
  values: {
    id: string;
    forecastYear: number;
    predictedValue: number;
    lowerBound95: number;
    upperBound95: number;
    baselineValue?: number;
    isActual: boolean;
  }[];
}

export interface PowerBIReport {
  id: string;
  reportName: string;
  reportId: string;
  workspaceId: string;
  embedUrl: string;
  targetAudience: string;
  daxMeasureCount: number;
  lastRefreshedAt: string;
}

export interface DaxMeasure {
  name: string;
  expression: string;
  format: string;
  description: string;
}
