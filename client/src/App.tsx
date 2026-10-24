import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { MarketAnalysisPage } from './pages/MarketAnalysisPage';
import { GeographicPage } from './pages/GeographicPage';
import { ManufacturersPage } from './pages/ManufacturersPage';
import { DataManagementPage } from './pages/DataManagementPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { PowerBIPage } from './pages/PowerBIPage';
import { ForecastingPage } from './pages/ForecastingPage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/market-analysis" element={<MarketAnalysisPage />} />
            <Route path="/geographic" element={<GeographicPage />} />
            <Route path="/manufacturers" element={<ManufacturersPage />} />
            <Route path="/data-management" element={<DataManagementPage />} />
            <Route path="/data-quality" element={<DataQualityPage />} />
            <Route path="/power-bi" element={<PowerBIPage />} />
            <Route path="/forecasting" element={<ForecastingPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
