import React from 'react';
import { Download, Info } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  onExportCsv?: () => void;
  infoTooltip?: string;
  className?: string;
  headerRight?: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  action,
  onExportCsv,
  infoTooltip,
  className = '',
  headerRight,
}) => {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-semibold text-slate-900 tracking-tight">{title}</h3>
            {infoTooltip && (
              <span title={infoTooltip} className="cursor-help text-slate-400 hover:text-slate-600">
                <Info className="w-4 h-4" />
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {headerRight}
          {action}
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              title="Export chart data as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        {children}
      </div>
    </div>
  );
};
