/**
 * EV Market Analysis & Time-Series Forecasting Pipeline (TypeScript / Node.js)
 * ---------------------------------------------------------------------------
 * Implements Holt's Two-Parameter Linear Exponential Smoothing on historical VAHAN EV data.
 * Computes Level and Trend parameters, error metrics (MAE, RMSE, MAPE), and 5-year projections (2026-2030)
 * with 95% confidence intervals.
 *
 * Usage:
 *   npm run forecast (from server directory)
 *   or npx tsx scripts/forecast_analysis.ts (from root directory)
 */

import * as fs from 'fs';
import * as path from 'path';

const BASE_DIR = path.resolve(__dirname, '..');
const DATA_RAW = path.join(BASE_DIR, 'data', 'raw', 'vahan_india_ev_registrations.csv');
const OUTPUT_DIR = path.join(BASE_DIR, 'data', 'processed');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'forecast_projections_2026_2030.csv');

interface AnnualRecord {
  year: number;
  total: number;
}

interface Projection {
  year: number;
  forecast: number;
  lowerBound95: number;
  upperBound95: number;
  horizonStep: number;
}

interface Metrics {
  mae: number;
  rmse: number;
  mape: number;
}

function loadVahanData(filePath: string): AnnualRecord[] {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: Dataset not found at ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  const headers = lines[0].split(',').map(h => h.trim());

  const yearIdx = headers.indexOf('year');
  const evIdx = headers.indexOf('ev_registrations');

  const annualMap = new Map<number, number>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const year = parseInt(cols[yearIdx], 10);
    const evRegs = parseFloat(cols[evIdx]);

    if (!isNaN(year) && !isNaN(evRegs)) {
      annualMap.set(year, (annualMap.get(year) || 0) + evRegs);
    }
  }

  const sorted = Array.from(annualMap.entries())
    .map(([year, total]) => ({ year, total }))
    .sort((a, b) => a.year - b.year);

  return sorted;
}

function calculateMetrics(actual: number[], predicted: number[]): Metrics {
  const n = actual.length;
  if (n === 0 || predicted.length !== n) {
    return { mae: 0, rmse: 0, mape: 0 };
  }

  let maeSum = 0;
  let rmseSum = 0;
  let mapeSum = 0;

  for (let i = 0; i < n; i++) {
    const a = actual[i];
    const p = predicted[i];
    maeSum += Math.abs(a - p);
    rmseSum += Math.pow(a - p, 2);
    if (a > 0) {
      mapeSum += Math.abs((a - p) / a);
    }
  }

  return {
    mae: Number((maeSum / n).toFixed(2)),
    rmse: Number(Math.sqrt(rmseSum / n).toFixed(2)),
    mape: Number(((mapeSum / n) * 100).toFixed(2))
  };
}

function holtForecast(
  data: AnnualRecord[],
  alpha: number = 0.6,
  beta: number = 0.3,
  horizon: number = 5
): { projections: Projection[]; metrics: Metrics } {
  const values = data.map(d => d.total);
  const years = data.map(d => d.year);
  const n = values.length;

  let level = values[0];
  let trend = values[1] - values[0];

  const fitted: number[] = [values[0]];

  for (let t = 1; t < n; t++) {
    const prevLevel = level;
    const prevTrend = trend;
    const yt = values[t];

    fitted.push(prevLevel + prevTrend);

    level = alpha * yt + (1 - alpha) * (prevLevel + prevTrend);
    trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
  }

  const metrics = calculateMetrics(values.slice(1), fitted.slice(1));

  // Residual std for 95% confidence intervals
  const residuals = values.slice(1).map((a, i) => a - fitted[i + 1]);
  const residualStd = Math.sqrt(
    residuals.reduce((acc, r) => acc + r * r, 0) / residuals.length
  );

  const projections: Projection[] = [];
  const lastYear = years[years.length - 1];

  for (let h = 1; h <= horizon; h++) {
    const fcYear = lastYear + h;
    const pointForecast = level + h * trend;
    const expansion = Math.sqrt(1 + (h - 1) * Math.pow(alpha, 2));
    const margin = 1.96 * residualStd * expansion;

    projections.push({
      year: fcYear,
      forecast: Math.round(pointForecast),
      lowerBound95: Math.max(0, Math.round(pointForecast - margin)),
      upperBound95: Math.round(pointForecast + margin),
      horizonStep: h
    });
  }

  return { projections, metrics };
}

function main() {
  console.log('======================================================================');
  console.log('  INDIA EV MARKET TIME-SERIES FORECASTING & ACCURACY EVALUATION      ');
  console.log('======================================================================');
  console.log(`Loading official dataset from: ${DATA_RAW}\n`);

  const annualData = loadVahanData(DATA_RAW);

  console.log(`Historical Observations (${annualData.length} reporting periods):`);
  console.log('----------------------------------------------------------------------');
  console.log(`${'Year'.padEnd(8)} | ${'Total EV Registrations'.padEnd(25)} | ${'YoY Growth (%)'.padEnd(15)}`);
  console.log('----------------------------------------------------------------------');

  annualData.forEach((row, i) => {
    let yoyStr = 'Baseline';
    if (i > 0) {
      const prev = annualData[i - 1].total;
      const yoy = ((row.total - prev) / prev) * 100;
      yoyStr = `${yoy >= 0 ? '+' : ''}${yoy.toFixed(2)}%`;
    }
    console.log(`${row.year.toString().padEnd(8)} | ${row.total.toLocaleString().padStart(25)} | ${yoyStr.padStart(15)}`);
  });
  console.log('----------------------------------------------------------------------\n');

  const { projections, metrics } = holtForecast(annualData, 0.6, 0.3, 5);

  console.log("Model Evaluation Performance (Backtesting on 2018-2025 data):");
  console.log('----------------------------------------------------------------------');
  console.log("Algorithm: Holt's Linear Exponential Smoothing (Alpha=0.6, Beta=0.3)");
  console.log(`Mean Absolute Error (MAE)            : ${metrics.mae.toLocaleString()} registrations`);
  console.log(`Root Mean Squared Error (RMSE)       : ${metrics.rmse.toLocaleString()} registrations`);
  console.log(`Mean Absolute Percentage Error (MAPE): ${metrics.mape.toFixed(2)}% (High Accuracy < 10%)`);
  console.log('----------------------------------------------------------------------\n');

  console.log("5-Year Projected Horizon (2026-2030) with 95% Confidence Intervals:");
  console.log('----------------------------------------------------------------------');
  console.log(`${'Year'.padEnd(8)} | ${'Forecast Value'.padEnd(18)} | ${'95% Lower Bound'.padEnd(18)} | ${'95% Upper Bound'.padEnd(18)}`);
  console.log('----------------------------------------------------------------------');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const csvRows = ['year,forecast_ev_registrations,lower_bound_95,upper_bound_95,horizon_step'];

  projections.forEach(p => {
    console.log(
      `${p.year.toString().padEnd(8)} | ${p.forecast.toLocaleString().padStart(18)} | ${p.lowerBound95.toLocaleString().padStart(18)} | ${p.upperBound95.toLocaleString().padStart(18)}`
    );
    csvRows.push(`${p.year},${p.forecast},${p.lowerBound95},${p.upperBound95},${p.horizonStep}`);
  });

  fs.writeFileSync(OUTPUT_FILE, csvRows.join('\n'), 'utf-8');

  console.log('----------------------------------------------------------------------');
  console.log(`\n[OK] Forecasted values successfully exported to: ${OUTPUT_FILE}`);
  console.log('======================================================================\n');
}

main();
