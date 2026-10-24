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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { ColumnDef } from '@tanstack/react-table';
import api from '../services/api';
import { ManufacturerData } from '../types';
import { ChartCard } from '../components/common/ChartCard';
import { DataTable } from '../components/common/DataTable';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Badge } from '../components/common/Badge';
import { Award, Building2, CheckCircle2 } from 'lucide-react';

const COLORS = ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];

export const ManufacturersPage: React.FC = () => {
  const { selectedYear } = useOutletContext<{ selectedYear: number }>();
  const [manufacturers, setManufacturers] = useState<ManufacturerData[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManufacturers = async () => {
      setLoading(true);
      try {
        const catParam = categoryFilter !== 'ALL' ? `&categoryCode=${categoryFilter}` : '';
        const res: any = await api.get(`/analytics/manufacturers?year=${selectedYear}${catParam}`);
        if (res.success) {
          setManufacturers(res.data);
        }
      } catch (err) {
        console.error('Failed to load manufacturers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchManufacturers();
  }, [selectedYear, categoryFilter]);

  const columns: ColumnDef<ManufacturerData>[] = [
    {
      accessorKey: 'nationalRank',
      header: 'Rank',
      cell: (info) => (
        <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-200">
          #{String(info.getValue())}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Manufacturer Brand',
      cell: (info) => (
        <div>
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            {String(info.getValue())}
            {info.row.original.isIndianOEM && (
              <span title="Indian Domestic OEM">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
              </span>
            )}
          </span>
          <span className="text-[10px] text-slate-400">
            HQ: {info.row.original.headquarters || 'India'} &bull; Origin: {info.row.original.originCountry}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'categoryCode',
      header: 'Category Segment',
      cell: (info) => (
        <Badge variant={String(info.getValue()) === '4W' ? 'primary' : String(info.getValue()) === '2W' ? 'info' : 'warning'}>
          E-{String(info.getValue())}
        </Badge>
      ),
    },
    {
      accessorKey: 'annualRegistrations',
      header: 'Registrations',
      cell: (info) => (
        <span className="font-bold text-slate-900">
          {Number(info.getValue()).toLocaleString('en-IN')} units
        </span>
      ),
    },
    {
      accessorKey: 'marketSharePct',
      header: 'Category Market Share %',
      cell: (info) => (
        <div className="flex items-center gap-2">
          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${Math.min(100, Number(info.getValue()))}%` }}
            />
          </div>
          <span className="font-bold text-slate-800 text-xs">{Number(info.getValue()).toFixed(1)}%</span>
        </div>
      ),
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

  // Top 7 OEMs for Market Share Pie Chart
  const topOems = manufacturers.slice(0, 7).map((m) => ({
    name: m.name,
    value: m.annualRegistrations,
    share: m.marketSharePct,
  }));

  return (
    <div className="space-y-6">
      {/* Category Segment Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', '2W', '3W', '4W', 'BUS'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'ALL' ? 'All Vehicle Categories' : `Electric ${cat}`}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Reporting {manufacturers.length} OEM Brand Leaders in {selectedYear}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OEM Registration Volume Bar Chart */}
        <ChartCard
          title="Top OEM Registration Volumes"
          subtitle={`Annual units registered in ${selectedYear}`}
          className="lg:col-span-2"
          infoTooltip="Figures are from official state RTO VAHAN registration logs."
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={manufacturers.slice(0, 8)} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} interval={0} angle={-15} textAnchor="end" />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
              />
              <Tooltip
                formatter={(val: any) => [Number(val).toLocaleString('en-IN') + ' units', 'Registrations']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Bar dataKey="annualRegistrations" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Market Share Donut Chart */}
        <ChartCard
          title="Market Share Breakdown"
          subtitle={`Segment competitiveness in ${selectedYear}`}
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={topOems}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {topOems.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: any, _name, item: any) => [
                  `${Number(val).toLocaleString('en-IN')} units (${item.payload.share}%)`,
                  item.payload.name,
                ]}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* OEM Leaderboard Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">
            OEM Brand Market Leaderboard & Ranks
          </h3>
          <p className="text-xs text-slate-500">
            Official rankings, vehicle volume, and percentage market share
          </p>
        </div>

        <DataTable
          data={manufacturers}
          columns={columns}
          searchPlaceholder="Search brand, category, or origin..."
        />
      </div>
    </div>
  );
};
