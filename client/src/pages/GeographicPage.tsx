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
  Cell,
} from 'recharts';
import { ColumnDef } from '@tanstack/react-table';
import api from '../services/api';
import fallbackData from '../services/fallbackData.json';
import { RegionData } from '../types';
import { ChartCard } from '../components/common/ChartCard';
import { DataTable } from '../components/common/DataTable';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Badge } from '../components/common/Badge';
import { MapPin, BatteryCharging, Zap } from 'lucide-react';

export const GeographicPage: React.FC = () => {
  const { selectedYear } = useOutletContext<{ selectedYear: number }>();
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegions = async () => {
      setLoading(true);
      const zoneParam = selectedZone !== 'ALL' ? `&zone=${selectedZone}` : '';
      let defaultList = (fallbackData.regions as any)[selectedYear] || (fallbackData.regions as any)[2025] || [];
      if (selectedZone !== 'ALL') {
        defaultList = defaultList.filter((r: any) => r.zone.toLowerCase() === selectedZone.toLowerCase());
      }

      try {
        const res: any = await api.get(`/analytics/regions?year=${selectedYear}${zoneParam}`);
        if (res && res.success && Array.isArray(res.data)) {
          setRegions(res.data);
        } else {
          setRegions(defaultList);
        }
      } catch (err) {
        console.error('Failed to load geographic data:', err);
        setRegions(defaultList);
      } finally {
        setLoading(false);
      }
    };

    fetchRegions();
  }, [selectedYear, selectedZone]);

  const columns: ColumnDef<RegionData>[] = [
    {
      accessorKey: 'stateCode',
      header: 'Code',
      cell: (info) => (
        <span className="w-7 h-7 rounded bg-slate-100 font-bold text-slate-800 flex items-center justify-center text-[10px]">
          {String(info.getValue())}
        </span>
      ),
    },
    {
      accessorKey: 'stateName',
      header: 'State / Territory',
      cell: (info) => (
        <div>
          <span className="font-bold text-slate-900 block">{String(info.getValue())}</span>
          <span className="text-[10px] text-slate-400">{info.row.original.zone} Zone • Cap: {info.row.original.capital}</span>
        </div>
      ),
    },
    {
      accessorKey: 'evRegistrations',
      header: 'EV Registrations',
      cell: (info) => (
        <span className="font-bold text-blue-600">
          {Number(info.getValue()).toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      accessorKey: 'totalVehicleRegistrations',
      header: 'Total Vehicles',
      cell: (info) => Number(info.getValue()).toLocaleString('en-IN'),
    },
    {
      accessorKey: 'evPenetrationPct',
      header: 'EV Penetration %',
      cell: (info) => {
        const val = Number(info.getValue());
        const isHigh = val >= 10.0;
        return (
          <span
            className={`px-2 py-0.5 rounded font-bold ${
              isHigh ? 'bg-teal-100 text-teal-800 border border-teal-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {val.toFixed(2)}%
          </span>
        );
      },
    },
    {
      accessorKey: 'chargingStations',
      header: 'Operational Fast Chargers',
      cell: (info) => {
        const infra = info.getValue() as any;
        if (!infra) return <span className="text-slate-400">N/A</span>;
        return (
          <div>
            <span className="font-semibold text-slate-800 block">
              {infra.operational.toLocaleString()} / {infra.sanctioned.toLocaleString()}
            </span>
            <span className="text-[10px] text-teal-600 font-medium">
              {infra.dcFast} DC Fast • {infra.commissioningRatePct}% commissioned
            </span>
          </div>
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

  // Top 10 by EV volume
  const top10Volume = [...regions].slice(0, 10);
  // Top 10 by EV Penetration rate
  const top10Penetration = [...regions].sort((a, b) => b.evPenetrationPct - a.evPenetrationPct).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Zone Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'North', 'South', 'West', 'East', 'Central'].map((z) => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedZone === z
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {z === 'ALL' ? 'All Zones (National)' : `${z} Zone`}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {regions.length} Indian States & UTs in {selectedYear}
        </div>
      </div>

      {/* Dual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* State Volume Ranking Bar Chart */}
        <ChartCard
          title="State EV Registration Volumes"
          subtitle={`Top states by total electric vehicles registered in ${selectedYear}`}
          infoTooltip="Uttar Pradesh leads primarily in 3W e-rickshaws; Maharashtra leads in private 2W and 4W."
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={top10Volume} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
              />
              <YAxis dataKey="stateCode" type="category" stroke="#94a3b8" fontSize={11} />
              <Tooltip
                formatter={(val: any) => [Number(val).toLocaleString('en-IN') + ' units', 'EV Registrations']}
                labelFormatter={(lbl) => {
                  const r = regions.find((x) => x.stateCode === lbl);
                  return r ? `${r.stateName} (${r.stateCode})` : lbl;
                }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Bar dataKey="evRegistrations" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* State Penetration % Bar Chart */}
        <ChartCard
          title="State EV Penetration Rates (%)"
          subtitle="Proportion of EV registrations compared to total automotive registrations"
          infoTooltip="Delhi leads India in penetration % due to dedicated EV tariffs, road tax waivers, and scrap incentives."
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={top10Penetration} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                stroke="#94a3b8"
                fontSize={11}
                unit="%"
                domain={[0, 'dataMax + 2']}
              />
              <YAxis dataKey="stateCode" type="category" stroke="#94a3b8" fontSize={11} />
              <Tooltip
                formatter={(val: any) => [`${Number(val).toFixed(2)}%`, 'Penetration Rate']}
                labelFormatter={(lbl) => {
                  const r = regions.find((x) => x.stateCode === lbl);
                  return r ? `${r.stateName} (${r.stateCode})` : lbl;
                }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Bar dataKey="evPenetrationPct" fill="#0d9488" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* State Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900 tracking-tight">
            State-Level EV Adoption & Infrastructure Registry
          </h3>
          <p className="text-xs text-slate-500">
            Searchable breakdown of vehicle volumes and PM E-DRIVE fast-charging deployment
          </p>
        </div>

        <DataTable
          data={regions}
          columns={columns}
          searchPlaceholder="Search state, capital, or zone..."
          onExportCsv={() => {
            window.location.href = `/api/v1/admin/export-csv?year=${selectedYear}`;
          }}
        />
      </div>
    </div>
  );
};
