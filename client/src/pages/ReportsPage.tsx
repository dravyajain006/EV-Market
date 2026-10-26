import React, { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Filter, CheckCircle2, RefreshCw } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import api from '../services/api';
import fallbackData from '../services/fallbackData.json';
import { DataTable } from '../components/common/DataTable';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Badge } from '../components/common/Badge';

export const ReportsPage: React.FC = () => {
  const initialRecords = (fallbackData.regions as any)[2025] || [];
  const [records, setRecords] = useState<any[]>(initialRecords);
  const [yearFilter, setYearFilter] = useState<number>(2025);
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReportsData = async () => {
      let defaultList = (fallbackData.regions as any)[yearFilter] || (fallbackData.regions as any)[2025] || [];
      if (zoneFilter !== 'ALL') {
        defaultList = defaultList.filter((r: any) => r.zone.toLowerCase() === zoneFilter.toLowerCase());
      }
      try {
        const zoneParam = zoneFilter !== 'ALL' ? `&zone=${zoneFilter}` : '';
        const res: any = await api.get(`/analytics/regions?year=${yearFilter}${zoneParam}`);
        if (res && res.success && Array.isArray(res.data)) {
          setRecords(res.data);
        } else {
          setRecords(defaultList);
        }
      } catch (err) {
        console.error('Failed to load reports data:', err);
        setRecords(defaultList);
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [yearFilter, zoneFilter]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'stateCode',
      header: 'State Code',
      cell: (info) => <span className="font-bold font-mono text-slate-800">{String(info.getValue())}</span>,
    },
    {
      accessorKey: 'stateName',
      header: 'State / Union Territory',
      cell: (info) => (
        <div>
          <span className="font-bold text-slate-900 block">{String(info.getValue())}</span>
          <span className="text-[10px] text-slate-400">{info.row.original.zone} Zone</span>
        </div>
      ),
    },
    {
      accessorKey: 'year',
      header: 'Reporting Year',
      cell: (info) => String(info.getValue()),
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
      header: 'Total Vehicles (All Powertrains)',
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
      accessorKey: 'chargingStations',
      header: 'Operational Fast Chargers',
      cell: (info) => {
        const infra = info.getValue() as any;
        return infra ? `${infra.operational.toLocaleString()} units` : 'N/A';
      },
    },
  ];

  const handleExport = () => {
    window.location.href = `/api/v1/admin/export-csv?year=${yearFilter}`;
  };

  return (
    <div className="space-y-6">
      {/* Export Action Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Analytical Export & Institutional Reports
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Export filtered observations as standard comma-separated values (CSV) for spreadsheet modeling, academic viva review, or further statistical analysis.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          Export Active Dataset (CSV)
        </button>
      </div>

      {/* Filter Parameters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-700">Filter Year:</span>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
          >
            {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700">Geographic Zone:</span>
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
          >
            {['ALL', 'North', 'South', 'West', 'East', 'Central'].map((z) => (
              <option key={z} value={z}>
                {z === 'ALL' ? 'All Zones' : `${z} Zone`}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-xs text-slate-500 font-medium">
          {records.length} records matching active filters
        </div>
      </div>

      {/* TanStack Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
        {loading ? (
          <LoadingSkeleton type="table" />
        ) : (
          <DataTable
            data={records}
            columns={columns}
            searchPlaceholder="Search state code or name..."
            onExportCsv={handleExport}
          />
        )}
      </div>
    </div>
  );
};
