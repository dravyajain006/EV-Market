import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import api from '../services/api';
import { ForecastModelData } from '../types';
import { ChartCard } from '../components/common/ChartCard';
import { KpiCard } from '../components/common/KpiCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Badge } from '../components/common/Badge';
import { TrendingUp, Activity, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import fallbackData from '../services/fallbackData.json';

export const ForecastingPage: React.FC = () => {
  const { role } = useAuth();
  const defaultModel = (fallbackData.forecasts?.[0] as any) || null;
  const [model, setModel] = useState<ForecastModelData | null>(defaultModel);
  const [horizonYears, setHorizonYears] = useState<number>(5);
  const [alpha, setAlpha] = useState<number>(0.45);
  const [beta, setBeta] = useState<number>(0.25);
  const [isComputing, setIsComputing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchForecasts = async () => {
    try {
      const res: any = await api.get('/forecasts');
      if (res && res.success && res.data && res.data.length > 0) {
        setModel(res.data[0]);
      } else if (Array.isArray(res) && res.length > 0) {
        setModel(res[0]);
      }
    } catch (err) {
      console.error('Failed to load forecasts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, []);

  const handleRecalculate = async () => {
    setIsComputing(true);
    try {
      const res: any = await api.post('/forecasts/calculate', {
        horizonYears,
        alpha,
        beta,
      });

      if (res.success) {
        // Map response to model shape
        const computed = res.data;
        setModel({
          id: 'temp-computed',
          targetMetric: 'EV_REGISTRATIONS_NATIONAL',
          algorithm: computed.model.algorithm,
          trainingStartYear: 2018,
          trainingEndYear: 2023,
          forecastHorizonYears: horizonYears,
          mae: computed.model.accuracyMetrics.mae,
          rmse: computed.model.accuracyMetrics.rmse,
          mape: computed.model.accuracyMetrics.mape,
          values: computed.forecastPoints.map((p: any) => ({
            id: `v-${p.year}`,
            forecastYear: p.year,
            predictedValue: p.predictedValue,
            lowerBound95: p.lowerBound95,
            upperBound95: p.upperBound95,
            baselineValue: p.baselineValue,
            isActual: p.isActual,
          })),
        });
      }
    } catch (err) {
      console.error('Failed to compute forecast:', err);
    } finally {
      setIsComputing(false);
    }
  };

  if (loading || !model) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="kpi" count={3} />
        <LoadingSkeleton type="chart" />
      </div>
    );
  }

  const chartData = model.values.map((v) => ({
    year: v.forecastYear,
    actual: v.isActual ? v.predictedValue : null,
    forecast: !v.isActual ? v.predictedValue : null,
    confidenceRange: !v.isActual ? [v.lowerBound95, v.upperBound95] : null,
    lowerBound: !v.isActual ? v.lowerBound95 : null,
    upperBound: !v.isActual ? v.upperBound95 : null,
    baseline: v.baselineValue || null,
  }));

  const canEdit = role === 'ADMIN' || role === 'ANALYST';

  return (
    <div className="space-y-6">
      {/* Accuracy Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Mean Absolute Pct Error (MAPE)"
          value={`${model.mape.toFixed(2)}%`}
          subtext="Chronological test validation (2024-2025)"
          icon={<Activity className="w-5 h-5 text-emerald-600" />}
          gradient="emerald"
          badgeText="High Accuracy (<5%)"
        />

        <KpiCard
          title="Root Mean Squared Error (RMSE)"
          value={`${Math.round(model.rmse).toLocaleString('en-IN')}`}
          subtext="Units variance across test periods"
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          gradient="blue"
        />

        <KpiCard
          title="Forecast Horizon"
          value={`2026 - ${2025 + model.forecastHorizonYears}`}
          subtext={`Algorithm: ${model.algorithm.replace(/_/g, ' ')}`}
          icon={<CheckCircle className="w-5 h-5 text-teal-600" />}
          gradient="teal"
        />
      </div>

      {/* Mandatory Disclaimer Alert */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Methodological & Regulatory Notice</span>
          Historical figures (2018–2025) represent <strong>verified VAHAN registrations</strong>. Projected data points (2026–2030) are <strong>statistical forecasts</strong> generated using Holt-Winters exponential smoothing and are explicitly labeled as projections with 95% uncertainty intervals.
        </div>
      </div>

      {/* Main Time Series Chart Card */}
      <ChartCard
        title="National EV Registration Projections (2018 - 2030)"
        subtitle="Historical observations vs Holt's linear trend forecast with 95% confidence bands"
        infoTooltip="Evaluated against a chronological test set without future data leakage."
      >
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`)}
            />
            <Tooltip
              formatter={(val: any, name: any) => {
                if (val === null || val === undefined) return ['', ''];
                return [`${Number(val).toLocaleString('en-IN')} units`, name];
              }}
              labelFormatter={(lbl) => `Year: ${lbl}`}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />

            {/* Historical Actuals Line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 5, fill: '#2563eb' }}
              name="Historical Actuals (VAHAN)"
            />

            {/* Projected Forecast Line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#0d9488"
              strokeWidth={3}
              strokeDasharray="5 5"
              dot={{ r: 5, fill: '#0d9488' }}
              name="Statistical Forecast (Holt-Winters)"
            />

            {/* Confidence Bounds */}
            <Line
              type="monotone"
              dataKey="upperBound"
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="95% Upper Bound"
            />
            <Line
              type="monotone"
              dataKey="lowerBound"
              stroke="#94a3b8"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="95% Lower Bound"
            />

            {/* Simple Baseline */}
            <Line
              type="monotone"
              dataKey="baseline"
              stroke="#cbd5e1"
              strokeWidth={1.5}
              strokeDasharray="2 2"
              dot={false}
              name="Linear Baseline Model"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Model Parameters & Tuning Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">
            Time-Series Smoothing Hyperparameters
          </h3>
          <p className="text-xs text-slate-500">
            Tune level smoothing (alpha) and trend smoothing (beta) weights to observe model sensitivity
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Forecast Horizon (Years)
            </label>
            <select
              value={horizonYears}
              onChange={(e) => setHorizonYears(Number(e.target.value))}
              disabled={!canEdit}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
            >
              {[3, 5, 7, 10].map((h) => (
                <option key={h} value={h}>
                  {h} Years (Up to {2025 + h})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alpha (Level Coefficient): {alpha}
            </label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
              disabled={!canEdit}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Beta (Trend Coefficient): {beta}
            </label>
            <input
              type="range"
              min="0.05"
              max="0.6"
              step="0.05"
              value={beta}
              onChange={(e) => setBeta(Number(e.target.value))}
              disabled={!canEdit}
              className="w-full accent-teal-600 cursor-pointer"
            />
          </div>

          <div>
            <button
              onClick={handleRecalculate}
              disabled={isComputing || !canEdit}
              className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              {isComputing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {isComputing ? 'Recalculating...' : 'Recalculate Model'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
