import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { ColumnDef } from '@tanstack/react-table';
import api from '../services/api';
import { ChartCard } from '../components/common/ChartCard';
import { DataTable } from '../components/common/DataTable';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Badge } from '../components/common/Badge';
import { Layers, Globe, Filter, AlertTriangle } from 'lucide-react';

export const MarketAnalysisPage: React.FC = () => {
  const { selectedYear } = useOutletContext<{ selectedYear: number }>();
  const [trends, setTrends] = useState<any[]>([]);
  const [categoryTrends, setCategoryTrends] = useState<any[]>([]);
  const [globalData, setGlobalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      setLoading(true);
      try {
        const [trendsRes, globalRes]: any = await Promise.all([
          api.get('/analytics/trends'),
          api.get(`/analytics/global?year=${selectedYear}`),
        ]);

        if (trendsRes.success) {
          setTrends(trendsRes.data.nationalTrends);
          // Pivot category trends by year
          const byYear: Record<number, any> = {};
          trendsRes.data.categoryTrends.forEach((item: any) => {
            if (!byYear[item.year]) byYear[item.year] = { year: item.year };
            byYear[item.year][item.categoryCode] = item.evRegistrations;
          });
          setCategoryTrends(Object.values(byYear));
        }

        if (globalRes.success) {
          setGlobalData(globalRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load market analysis data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [selectedYear]);

  // TanStack table columns for National Trend Analysis
  const trendColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'year',
      header: 'Observation Year',
      cell: (info) => <span className="font-bold text-slate-900">{String(info.getValue())}</span>,
    },
    {
      accessorKey: 'evRegistrations',
      header: 'EV Registrations (VAHAN)',
      cell: (info) => (
        <span className="font-semibold text-blue-600">
          {Number(info.getValue()).toLocaleString('en-IN')} units
        </span>
      ),
    },
    {
      accessorKey: 'totalVehicleRegistrations',
      header: 'Total Vehicles (All Fuels)',
      cell: (info) => Number(info.getValue()).toLocaleString('en-IN'),
    },
    {
      accessorKey: 'evPenetrationPct',
      header: 'EV Penetration %',
      cell: (info) => (
        <span className="px-2 py-0.5 rounded font-bold bg-teal-50 text-teal-700 border border-teal-200">
          {Number(info.getValue()).toFixed(2)}%
        </span>
      ),
    },
    {
      accessorKey: 'yoyGrowthPct',
      header: 'YoY Growth Rate %',
      cell: (info) => {
        const val = info.getValue() as number | null;
        if (val === null) return <span className="text-slate-400">Baseline (2018)</span>;
        return (
          <span className={`font-semibold ${val >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {val >= 0 ? `+${val.toFixed(2)}%` : `${val.toFixed(2)}%`}
          </span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="chart" />
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Registration vs Sales Disclaimers Note */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900">
        <div className="p-1 rounded bg-blue-100 text-blue-700 mt-0.5">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold block">Methodological Note: Vehicle Registrations vs. Wholesale Sales</span>
          Indian domestic analytics reflect <strong>actual registrations</strong> recorded on the VAHAN public register upon vehicle delivery and licensing, eliminating OEM factory dispatch inflation. Global IEA figures benchmark international sales volume.
        </div>
      </div>

      {/* Category Multi-Line Trends */}
      <ChartCard
        title="Category-Wise Annual EV Registrations (2018 - 2025)"
        subtitle="Growth comparison of Electric 2-Wheelers, 3-Wheelers, 4-Wheelers, and Buses"
        infoTooltip="Shows how 2W and 3W adoption exploded post-2021 FAME II subsidy revisions."
      >
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={categoryTrends} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`)}
            />
            <Tooltip
              formatter={(val: any, name: any) => [Number(val).toLocaleString('en-IN') + ' units', `E-${name}`]}
              labelFormatter={(lbl) => `Year: ${lbl}`}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="2W" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} name="2-Wheeler (E-2W)" />
            <Line type="monotone" dataKey="3W" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4 }} name="3-Wheeler (E-3W)" />
            <Line type="monotone" dataKey="4W" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} name="4-Wheeler (E-4W)" />
            <Line type="monotone" dataKey="BUS" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} name="Electric Bus" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Global Comparison Chart with IEA Data */}
      <ChartCard
        title={`Global EV Market Benchmark (${selectedYear})`}
        subtitle="Annual electric vehicle sales across key world economies (IEA Global EV Data Explorer in Thousands)"
        infoTooltip="Source: International Energy Agency Global EV Data Explorer."
      >
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={globalData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="region" stroke="#94a3b8" fontSize={11} />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickFormatter={(v) => `${v.toLocaleString()}k`}
            />
            <Tooltip
              formatter={(val: any) => [`${Number(val).toLocaleString()} thousand units`, 'Sales Volume']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
            />
            <Bar dataKey="annualSalesThousands" fill="#0d9488" radius={[4, 4, 0, 0]} name="Annual EV Sales ('000)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Historical Trend TanStack Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">
            Historical Registration & Penetration Master Ledger
          </h3>
          <p className="text-xs text-slate-500">
            Validated national aggregates with transparent denominator compatibility
          </p>
        </div>

        <DataTable
          data={trends}
          columns={trendColumns}
          searchPlaceholder="Search year or volume..."
          onExportCsv={() => {
            window.location.href = '/api/v1/admin/export-csv';
          }}
        />
      </div>
    </div>
  );
};
