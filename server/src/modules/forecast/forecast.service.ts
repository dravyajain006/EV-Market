import prisma from '../../config/db.js';

export class ForecastService {
  /**
   * Retrieves statistical forecasts with error metrics, baseline comparisons, and confidence intervals
   */
  static async getForecasts() {
    const models = await prisma.forecastModel.findMany({
      include: {
        values: {
          orderBy: { forecastYear: 'asc' },
        },
      },
      orderBy: { trainedAt: 'desc' },
    });

    return models;
  }

  /**
   * Run or recalculate statistical forecast on actual historical registration data
   */
  static async computeForecast(params: { horizonYears?: number; alpha?: number; beta?: number }) {
    const horizonYears = params.horizonYears || 5;
    const alpha = params.alpha || 0.45; // Level smoothing coefficient
    const beta = params.beta || 0.25;  // Trend smoothing coefficient

    // Fetch chronological historical series (2018-2025)
    const series = await prisma.factEvRegistration.groupBy({
      by: ['year'],
      _sum: { evRegistrations: true },
      orderBy: { year: 'asc' },
    });

    const historical = series.map(s => ({
      year: s.year,
      actual: s._sum.evRegistrations || 0,
    })).filter(h => h.actual > 0);

    if (historical.length < 4) {
      throw new Error('Insufficient historical data points to train a robust time-series model');
    }

    // Chronological train/test split: Train on first (N - 2) years, test on last 2 years (2024, 2025)
    const trainSet = historical.slice(0, historical.length - 2);
    const testSet = historical.slice(historical.length - 2);

    // Fit Holt's Linear Exponential Smoothing on training set
    let level = trainSet[0].actual;
    let trend = trainSet[1].actual - trainSet[0].actual;

    for (let i = 1; i < trainSet.length; i++) {
      const prevLevel = level;
      level = alpha * trainSet[i].actual + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
    }

    // Evaluate on test set
    let absoluteErrors = 0;
    let squaredErrors = 0;
    let percentageErrors = 0;

    testSet.forEach((obs, step) => {
      const pred = level + (step + 1) * trend;
      const err = Math.abs(obs.actual - pred);
      absoluteErrors += err;
      squaredErrors += err * err;
      percentageErrors += (err / obs.actual) * 100;
    });

    const mae = Number((absoluteErrors / testSet.length).toFixed(2));
    const rmse = Number((Math.sqrt(squaredErrors / testSet.length)).toFixed(2));
    const mape = Number((percentageErrors / testSet.length).toFixed(2));

    // Full series refit for final forecast projection
    let fullLevel = historical[0].actual;
    let fullTrend = historical[1].actual - historical[0].actual;

    for (let i = 1; i < historical.length; i++) {
      const prev = fullLevel;
      fullLevel = alpha * historical[i].actual + (1 - alpha) * (fullLevel + fullTrend);
      fullTrend = beta * (fullLevel - prev) + (1 - beta) * fullTrend;
    }

    // Generate forecast points for horizon with 95% confidence bands (z ~ 1.96 * RMSE * sqrt(h))
    const lastYear = historical[historical.length - 1].year;
    const forecastPoints: any[] = [];

    // Add historical actuals
    historical.forEach(h => {
      forecastPoints.push({
        year: h.year,
        predictedValue: h.actual,
        lowerBound95: h.actual,
        upperBound95: h.actual,
        baselineValue: h.actual,
        isActual: true,
      });
    });

    // Add future forecasts
    const simpleAvgGrowth = (historical[historical.length - 1].actual - historical[0].actual) / (historical.length - 1);
    for (let h = 1; h <= horizonYears; h++) {
      const forecastYear = lastYear + h;
      const pointForecast = Math.round(fullLevel + h * fullTrend);
      const margin = Math.round(1.96 * (rmse > 0 ? rmse : 50000) * Math.sqrt(h));
      const baseline = Math.round(historical[historical.length - 1].actual + h * simpleAvgGrowth);

      forecastPoints.push({
        year: forecastYear,
        predictedValue: pointForecast,
        lowerBound95: Math.max(0, pointForecast - margin),
        upperBound95: pointForecast + margin,
        baselineValue: baseline,
        isActual: false,
      });
    }

    return {
      model: {
        algorithm: 'HOLT_LINEAR_EXPONENTIAL_SMOOTHING',
        parameters: { alpha, beta, damping: 1.0 },
        trainingPeriod: `${historical[0].year} - ${historical[historical.length - 3].year}`,
        testPeriod: `${testSet[0].year} - ${testSet[testSet.length - 1].year}`,
        accuracyMetrics: {
          mae,
          rmse,
          mape, // <5% is considered highly accurate
          status: mape < 10.0 ? 'STATISTICALLY_VALIDATED' : 'NEEDS_TUNING',
        },
      },
      forecastPoints,
    };
  }
}
