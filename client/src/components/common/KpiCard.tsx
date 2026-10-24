import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  changePct?: number | null;
  changeLabel?: string;
  subtext?: string;
  icon?: React.ReactNode;
  gradient?: 'blue' | 'teal' | 'purple' | 'emerald';
  badgeText?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  changePct,
  changeLabel = 'vs last year',
  subtext,
  icon,
  gradient = 'blue',
  badgeText,
}) => {
  const gradientClass = {
    blue: 'border-blue-100 hover:border-blue-300',
    teal: 'border-teal-100 hover:border-teal-300',
    purple: 'border-purple-100 hover:border-purple-300',
    emerald: 'border-emerald-100 hover:border-emerald-300',
  }[gradient];

  const iconBg = {
    blue: 'bg-blue-50 text-blue-600',
    teal: 'bg-teal-50 text-teal-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }[gradient];

  const hasChange = changePct !== undefined && changePct !== null;
  const isPositive = hasChange && changePct! > 0;
  const isZero = hasChange && changePct === 0;

  return (
    <div
      className={`bg-white rounded-xl border p-5 shadow-card hover:shadow-card-hover transition-all duration-200 relative overflow-hidden group ${gradientClass}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {value}
            </span>
            {badgeText && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                {badgeText}
              </span>
            )}
          </div>
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${iconBg} group-hover:scale-110 transition-transform duration-200`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        {hasChange ? (
          <div
            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700'
                : isZero
                ? 'bg-slate-100 text-slate-600'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : isZero ? (
              <Minus className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{isPositive ? `+${changePct}%` : `${changePct}%`}</span>
          </div>
        ) : null}
        <span className="text-slate-500 truncate">
          {changeLabel} {subtext ? `• ${subtext}` : ''}
        </span>
      </div>
    </div>
  );
};
