import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Zap,
  TrendingUp,
  Percent,
  MapPin,
  Award,
  BatteryCharging,
  Layers,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../services/api';
import { OverviewData, TrendPoint, RegionData } from '../types';
import fallbackData from '../services/fallbackData.json';
import { KpiCard } from '../components/common/KpiCard';
import { ChartCard } from '../components/common/ChartCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Badge } from '../components/common/Badge';

const CATEGORY_COLORS = ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899'];

export const OverviewPage: React.FC = () => {
  const { selectedYear } = useOutletContext<{ selectedYear: number }>();
  const [data, setData] = useState<OverviewData | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const defaultOverview = (fallbackData.overview as any)[selectedYear] || (fallbackData.overview as any)[2025];
      const defaultTrends = (fallbackData.trends as any)?.nationalTrends || [];
      const defaultRegions = (fallbackData.regions as any)[selectedYear] || (fallbackData.regions as any)[2025] || [];

      try {
        const [overviewRes, trendsRes, regionsRes]: any = await Promise.all([
          api.get(`/analytics/overview?year=${selectedYear}`),
          api.get('/analytics/trends'),
          api.get(`/analytics/regions?year=${selectedYear}`),
        ]);

        setData(overviewRes && overviewRes.success && overviewRes.data ? overviewRes.data : defaultOverview);
        setTrends(trendsRes && trendsRes.success && trendsRes.data?.nationalTrends ? trendsRes.data.nationalTrends : defaultTrends);
        setRegions(regionsRes && regionsRes.success && regionsRes.data ? regionsRes.data : defaultRegions);
      } catch (err) {
        console.error('Failed to load dashboard overview data:', err);
        setData(defaultOverview);
        setTrends(defaultTrends);
        setRegions(defaultRegions);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="kpi" count={4} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton type="chart" />
          <LoadingSkeleton type="chart" />
        </div>
      </div>
    );
  }

  const { kpiSummary, chargingInfra, categoryDistribution, dataProvenance } = data;

  const pieData = categoryDistribution.map((c) => ({
    name: c.categoryCode,
    value: c.evRegistrations,
    share: c.sharePct,
  }));

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={`Total EV Registrations (${selectedYear})`}
          value={kpiSummary.totalEvRegistrations.toLocaleString('en-IN')}
          changePct={kpiSummary.yoyGrowthPct}
          changeLabel="YoY Growth"
          subtext={`Prev: ${kpiSummary.previousYearEvRegistrations.toLocaleString('en-IN')}`}
          icon={<Zap className="w-5 h-5 text-blue-600" />}
          gradient="blue"
        />

        <KpiCard
          title="National EV Penetration Rate"
          value={`${kpiSummary.evPenetrationPct.toFixed(2)}%`}
          subtext={`of ${kpiSummary.totalVehicleRegistrations.toLocaleString('en-IN')} total vehicles`}
          icon={<Percent className="w-5 h-5 text-teal-600" />}
          gradient="teal"
          badgeText="Verified Formula"
        />

        <KpiCard
          title="Reporting States & UTs"
          value={kpiSummary.totalReportingRegions}
          subtext="Coverage across all zones"
          icon={<MapPin className="w-5 h-5 text-purple-600" />}
          gradient="purple"
        />

        <KpiCard
          title="Leading EV Brand"
          value={kpiSummary.leadingManufacturer?.name || 'Tata Motors'}
          subtext={`${kpiSummary.leadingManufacturer?.marketSharePct || 0}% segment share (${kpiSummary.leadingManufacturer?.category || '4W'})`}
          icon={<Award className="w-5 h-5 text-emerald-600" />}
          gradient="emerald"
        />
      </div>

      {/* Charging Infrastructure Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-navy-900 rounded-xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <BatteryCharging className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              PM E-DRIVE Public Charging Ecosystem
            </h4>
            <p className="text-xs text-slate-300">
              {chargingInfra.operationalStations.toLocaleString()} active charging stations commissioned out of{' '}
              {chargingInfra.sanctionedStations.toLocaleString()} sanctioned ({chargingInfra.overallCommissioningRate}% commissioning rate)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-300 border-t md:border-t-0 md:border-l border-slate-700/60 pt-3 md:pt-0 md:pl-6 w-full md:w-auto justify-between md:justify-start">
          <div>
            <span className="block font-bold text-white text-base">
              {chargingInfra.fastChargersDc.toLocaleString()}
            </span>
            <span className="text-[11px] text-teal-400">DC Fast Chargers</span>
          </div>
          <div>
            <span className="block font-bold text-white text-base">
              {chargingInfra.highwayCorridorChargers.toLocaleString()}
            </span>
            <span className="text-[11px] text-blue-400">Expressway Plazas</span>
          </div>
        </div>
      </div>

      {/* Main Analytical Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* National Historical Trend (Area Chart) */}
        <ChartCard
          title="National EV Registration Trajectory"
          subtitle="Annual volume growth from 2018 to 2025 across all vehicle segments"
          className="lg:col-span-2"
          infoTooltip="Calculated from official Ministry of Road Transport & Highways (VAHAN) registration databases."
        >
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={trends} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`)}
              />
              <Tooltip
                formatter={(val: any) => [Number(val).toLocaleString('en-IN') + ' units', 'EV Registrations']}
                labelFormatter={(lbl) => `Year: ${lbl}`}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="evRegistrations"
                stroke="#2563eb"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorEv)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Category Share Distribution (Donut Chart) */}
        <ChartCard
          title="Vehicle Category Distribution"
          subtitle={`Segment breakdown in ${selectedYear}`}
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: any, _name, item: any) => [
                  `${Number(val).toLocaleString('en-IN')} units (${item.payload.share}%)`,
                  item.payload.name,
                ]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center text-[11px] text-slate-500 mt-2">
            E-2W and E-3W account for &gt;90% of aggregate EV adoption volume in India.
          </div>
        </ChartCard>
      </div>

      {/* State Rankings Top 5 Preview Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">
              Top State EV Leaders ({selectedYear})
            </h3>
            <p className="text-xs text-slate-500">
              States ranked by aggregate electric vehicle registrations and penetration rates
            </p>
          </div>
          <Badge variant="primary">Top 5 States</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-4 font-semibold">Rank</th>
                <th className="py-2.5 px-4 font-semibold">State / UT</th>
                <th className="py-2.5 px-4 font-semibold">Zone</th>
                <th className="py-2.5 px-4 font-semibold text-right">EV Registrations</th>
                <th className="py-2.5 px-4 font-semibold text-right">EV Penetration %</th>
                <th className="py-2.5 px-4 font-semibold text-right">Charging Stations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regions.slice(0, 5).map((r, idx) => (
                <tr key={r.regionId} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                      {r.stateCode}
                    </span>
                    {r.stateName}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">{r.zone}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                    {r.evRegistrations.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span className="inline-block px-2 py-0.5 rounded font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                      {r.evPenetrationPct.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-600">
                    {r.chargingStations?.operational.toLocaleString() || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Freshness and Provenance Footer */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>
            Source: <strong>{dataProvenance.dataSource}</strong> &bull; Verified Observation Period:{' '}
            <strong>2018 - {selectedYear}</strong>
          </span>
        </div>
        <div>
          Last Synced: <span className="font-medium text-slate-700">{new Date(dataProvenance.lastUpdated).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
