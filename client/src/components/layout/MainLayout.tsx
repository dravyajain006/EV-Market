import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const location = useLocation();

  const getPageMeta = () => {
    const path = location.pathname;
    if (path.includes('/market-analysis')) {
      return { title: 'EV Market Analysis', subtitle: 'Category breakdown, market share dynamics, and OEM leader analysis' };
    }
    if (path.includes('/geographic')) {
      return { title: 'Geographic EV Adoption', subtitle: 'State-wise registration volumes, penetration rankings, and charging corridors' };
    }
    if (path.includes('/manufacturers')) {
      return { title: 'Manufacturer Rankings & OEM Share', subtitle: 'Top EV brands across 2W, 3W, 4W, and commercial segments' };
    }
    if (path.includes('/data-management')) {
      return { title: 'Data Management & Ingestion Pipeline', subtitle: 'CSV upload, schema mapping, duplicate detection, and safe import transactions' };
    }
    if (path.includes('/data-quality')) {
      return { title: 'Data Quality & Provenance Audit', subtitle: 'Completeness scores, validation logs, error downloads, and source URLs' };
    }
    if (path.includes('/power-bi')) {
      return { title: 'Microsoft Power BI Report Suite', subtitle: 'Interactive DAX-driven enterprise dashboards and report embedding' };
    }
    if (path.includes('/forecasting')) {
      return { title: 'Statistical Forecasting & 2030 Scenarios', subtitle: 'Holt-Winters exponential smoothing, error metrics (MAPE), and confidence intervals' };
    }
    if (path.includes('/reports')) {
      return { title: 'Reports & Analytical Export', subtitle: 'Filtered CSV dataset extraction and institutional summary tables' };
    }
    if (path.includes('/admin')) {
      return { title: 'System Administration & Audit Logs', subtitle: 'User role-based access management, permissions, and security audit trail' };
    }
    return { title: 'Executive EV Analytics Dashboard', subtitle: 'National registration trends, EV penetration %, and high-level KPIs' };
  };

  const { title, subtitle } = getPageMeta();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          title={title}
          subtitle={subtitle}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet context={{ selectedYear, setSelectedYear }} />
        </main>
      </div>
    </div>
  );
};
