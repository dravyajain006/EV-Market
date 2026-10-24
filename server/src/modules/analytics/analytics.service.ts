import prisma from '../../config/db.js';
import { calculateEvPenetration, calculateYoyGrowth } from '../../utils/formulas.js';

export class AnalyticsService {
  /**
   * Main Executive Dashboard Overview KPIs
   */
  static async getOverview(filters?: { year?: number; regionId?: string; categoryId?: string }) {
    const selectedYear = filters?.year || 2025;
    const prevYear = selectedYear - 1;

    // Filter conditions
    const whereCurrent: any = { year: selectedYear };
    const wherePrev: any = { year: prevYear };

    if (filters?.regionId) {
      whereCurrent.regionId = filters.regionId;
      wherePrev.regionId = filters.regionId;
    }
    if (filters?.categoryId) {
      whereCurrent.categoryId = filters.categoryId;
      wherePrev.categoryId = filters.categoryId;
    }

    // 1. Current Year Aggregations
    const currentRegs = await prisma.factEvRegistration.aggregate({
      where: whereCurrent,
      _sum: {
        evRegistrations: true,
        totalVehicleRegistrations: true,
      },
    });

    // 2. Previous Year Aggregations (for YoY Growth)
    const prevRegs = await prisma.factEvRegistration.aggregate({
      where: wherePrev,
      _sum: {
        evRegistrations: true,
        totalVehicleRegistrations: true,
      },
    });

    const totalEv = currentRegs._sum.evRegistrations || 0;
    const totalVehicles = currentRegs._sum.totalVehicleRegistrations || 0;
    const prevEv = prevRegs._sum.evRegistrations || 0;

    const evPenetrationRate = calculateEvPenetration(totalEv, totalVehicles);
    const yoyGrowthRate = calculateYoyGrowth(totalEv, prevEv);

    // 3. Reporting Regions Count
    const totalReportingRegions = await prisma.dimRegion.count({
      where: {
        evRegistrations: {
          some: { year: selectedYear },
        },
      },
    });

    // 4. Leading Manufacturer
    const topOem = await prisma.factManufacturerRanking.findFirst({
      where: { year: selectedYear },
      orderBy: { annualRegistrations: 'desc' },
      include: {
        manufacturer: true,
        category: true,
      },
    });

    // 5. Category Distribution for Current Year
    const categoryGroup = await prisma.factEvRegistration.groupBy({
      by: ['categoryId'],
      where: whereCurrent,
      _sum: {
        evRegistrations: true,
      },
    });

    const categories = await prisma.dimCategory.findMany();
    const categoryDistribution = categoryGroup.map(g => {
      const cat = categories.find(c => c.id === g.categoryId);
      const evCount = g._sum.evRegistrations || 0;
      const share = totalEv > 0 ? Number(((evCount / totalEv) * 100).toFixed(2)) : 0;
      return {
        categoryId: g.categoryId,
        categoryCode: cat?.categoryCode || 'OTHER',
        categoryName: cat?.categoryName || 'Unknown Category',
        evRegistrations: evCount,
        sharePct: share,
      };
    }).sort((a, b) => b.evRegistrations - a.evRegistrations);

    // 6. Charging Infrastructure Totals
    const infraTotal = await prisma.factChargingStation.aggregate({
      _sum: {
        sanctionedStations: true,
        operationalStations: true,
        fastChargersDc: true,
        slowChargersAc: true,
        highwayCorridorChargers: true,
      },
    });

    // 7. Latest Data Freshness Information
    const latestFact = await prisma.factEvRegistration.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, dataSource: true },
    });

    return {
      kpiSummary: {
        selectedYear,
        totalEvRegistrations: totalEv,
        totalVehicleRegistrations: totalVehicles,
        evPenetrationPct: evPenetrationRate,
        previousYearEvRegistrations: prevEv,
        yoyGrowthPct: yoyGrowthRate,
        totalReportingRegions,
        leadingManufacturer: topOem ? {
          name: topOem.manufacturer.name,
          category: topOem.category.categoryCode,
          annualRegistrations: topOem.annualRegistrations,
          marketSharePct: topOem.marketSharePct,
        } : null,
      },
      chargingInfra: {
        sanctionedStations: infraTotal._sum.sanctionedStations || 0,
        operationalStations: infraTotal._sum.operationalStations || 0,
        fastChargersDc: infraTotal._sum.fastChargersDc || 0,
        slowChargersAc: infraTotal._sum.slowChargersAc || 0,
        highwayCorridorChargers: infraTotal._sum.highwayCorridorChargers || 0,
        overallCommissioningRate: infraTotal._sum.sanctionedStations
          ? Number(((infraTotal._sum.operationalStations! / infraTotal._sum.sanctionedStations!) * 100).toFixed(2))
          : 0,
      },
      categoryDistribution,
      dataProvenance: {
        dataSource: latestFact?.dataSource || 'VAHAN_PUBLIC_DASHBOARD',
        lastUpdated: latestFact?.createdAt || new Date(),
        status: 'VERIFIED_OFFICIAL',
      },
    };
  }

  /**
   * Historical Trends (2018-2025)
   */
  static async getTrends(filters?: { regionId?: string; categoryId?: string }) {
    const where: any = {};
    if (filters?.regionId) where.regionId = filters.regionId;
    if (filters?.categoryId) where.categoryId = filters.categoryId;

    const yearlyData = await prisma.factEvRegistration.groupBy({
      by: ['year'],
      where,
      _sum: {
        evRegistrations: true,
        totalVehicleRegistrations: true,
      },
      orderBy: { year: 'asc' },
    });

    let prevEv = 0;
    const trends = yearlyData.map(y => {
      const ev = y._sum.evRegistrations || 0;
      const total = y._sum.totalVehicleRegistrations || 0;
      const penetration = calculateEvPenetration(ev, total);
      const yoy = calculateYoyGrowth(ev, prevEv > 0 ? prevEv : null);
      prevEv = ev;

      return {
        year: y.year,
        evRegistrations: ev,
        totalVehicleRegistrations: total,
        evPenetrationPct: penetration,
        yoyGrowthPct: yoy,
      };
    });

    // Also get category breakdown by year
    const yearlyByCategory = await prisma.factEvRegistration.groupBy({
      by: ['year', 'categoryId'],
      where,
      _sum: {
        evRegistrations: true,
      },
      orderBy: [{ year: 'asc' }, { categoryId: 'asc' }],
    });

    const categories = await prisma.dimCategory.findMany();
    const categoryTrends = yearlyByCategory.map(item => {
      const cat = categories.find(c => c.id === item.categoryId);
      return {
        year: item.year,
        categoryCode: cat?.categoryCode || 'OTHER',
        categoryName: cat?.categoryName || 'Unknown',
        evRegistrations: item._sum.evRegistrations || 0,
      };
    });

    return {
      nationalTrends: trends,
      categoryTrends,
    };
  }

  /**
   * State-wise EV Adoption & Geographic Analysis
   */
  static async getRegions(filters?: { year?: number; zone?: string }) {
    const year = filters?.year || 2025;
    const whereRegion: any = {};
    if (filters?.zone) {
      whereRegion.zone = filters.zone;
    }

    const regions = await prisma.dimRegion.findMany({
      where: whereRegion,
      include: {
        chargingStations: true,
        evRegistrations: {
          where: { year },
        },
      },
    });

    const results = regions.map(reg => {
      const evSum = reg.evRegistrations.reduce((acc, curr) => acc + curr.evRegistrations, 0);
      const totalVehiclesSum = reg.evRegistrations.reduce((acc, curr) => acc + curr.totalVehicleRegistrations, 0);
      const penetration = calculateEvPenetration(evSum, totalVehiclesSum);

      return {
        regionId: reg.id,
        stateCode: reg.stateCode,
        stateName: reg.stateName,
        zone: reg.zone,
        capital: reg.capital,
        year,
        evRegistrations: evSum,
        totalVehicleRegistrations: totalVehiclesSum,
        evPenetrationPct: penetration,
        chargingStations: reg.chargingStations ? {
          operational: reg.chargingStations.operationalStations,
          sanctioned: reg.chargingStations.sanctionedStations,
          dcFast: reg.chargingStations.fastChargersDc,
          acSlow: reg.chargingStations.slowChargersAc,
          highwayCorridor: reg.chargingStations.highwayCorridorChargers,
          commissioningRatePct: reg.chargingStations.commissioningRatePct,
        } : null,
      };
    }).sort((a, b) => b.evRegistrations - a.evRegistrations);

    return results;
  }

  /**
   * Manufacturer Rankings & Market Share
   */
  static async getManufacturers(filters?: { year?: number; categoryCode?: string }) {
    const year = filters?.year || 2025;
    const where: any = { year };

    if (filters?.categoryCode) {
      const cat = await prisma.dimCategory.findUnique({
        where: { categoryCode: filters.categoryCode },
      });
      if (cat) where.categoryId = cat.id;
    }

    const rankings = await prisma.factManufacturerRanking.findMany({
      where,
      include: {
        manufacturer: true,
        category: true,
      },
      orderBy: [
        { categoryId: 'asc' },
        { nationalRank: 'asc' },
      ],
    });

    return rankings.map(r => ({
      id: r.id,
      manufacturerId: r.manufacturerId,
      name: r.manufacturer.name,
      categoryCode: r.category.categoryCode,
      categoryName: r.category.categoryName,
      originCountry: r.manufacturer.originCountry,
      headquarters: r.manufacturer.headquarters,
      isIndianOEM: r.manufacturer.isIndianOEM,
      year: r.year,
      annualRegistrations: r.annualRegistrations,
      marketSharePct: r.marketSharePct,
      nationalRank: r.nationalRank,
    }));
  }

  /**
   * Global EV Comparison (IEA Data Explorer)
   */
  static async getGlobalComparison(year = 2025) {
    const data = await prisma.factGlobalEvMarket.findMany({
      where: { year },
      orderBy: { annualSalesThousands: 'desc' },
    });

    const historicalGlobal = await prisma.factGlobalEvMarket.findMany({
      where: { vehicleType: { in: ['Cars', 'All'] } },
      orderBy: [{ year: 'asc' }, { annualSalesThousands: 'desc' }],
    });

    return {
      currentYear: year,
      data,
      historicalGlobal,
    };
  }
}
