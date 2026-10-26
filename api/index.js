const express = require('express');
const cors = require('cors');
const data = require('./data.json');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health check endpoint
const sendHealth = (_req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'ev-market-analysis-backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'vercel-serverless-express',
  });
};

app.get('/health', sendHealth);
app.get('/api/health', sendHealth);
app.get('/api/v1/health', sendHealth);

const router = express.Router();

// 1. Auth: /auth/login
router.post('/auth/login', (req, res) => {
  const email = (req.body?.email || '').toLowerCase().trim();
  let matchedUser = data.users.find(u => u.email.toLowerCase() === email);

  if (!matchedUser) {
    if (email.includes('admin') || email.includes('dravya') || email.includes('karan')) {
      matchedUser = {
        id: 'usr_admin_default',
        email: req.body?.email || 'admindravya@ev',
        fullName: email.includes('karan') ? 'Karan Raikwar' : 'Dravya Jain',
        role: 'ADMIN',
        department: 'Executive Mobility Strategy & Administration',
        isActive: true,
      };
    } else if (email.includes('viewer')) {
      matchedUser = {
        id: 'usr_viewer_default',
        email: 'viewer@evmarket.internal',
        fullName: 'Ananya Verma (Industry Auditor)',
        role: 'VIEWER',
        department: 'Compliance & Academic Review',
        isActive: true,
      };
    } else {
      matchedUser = {
        id: 'usr_analyst_default',
        email: 'analyst@evmarket.internal',
        fullName: 'Priya Sundaram (Senior BI Analyst)',
        role: 'ANALYST',
        department: 'Market Intelligence & Forecasting',
        isActive: true,
      };
    }
  }

  const token = 'ev_token_' + Buffer.from(JSON.stringify({ id: matchedUser.id, role: matchedUser.role })).toString('base64');
  return res.status(200).json({
    success: true,
    data: {
      token,
      user: matchedUser,
    },
    message: 'Authentication successful',
  });
});

// 2. Auth: /auth/me
router.get('/auth/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  let user = data.users[0];
  if (authHeader.includes('ADMIN')) {
    user = data.users.find(u => u.role === 'ADMIN') || data.users[0];
  }
  return res.status(200).json({
    success: true,
    data: user,
    message: 'Authenticated user profile',
  });
});

// 3. Auth: /auth/logout
router.post('/auth/logout', (_req, res) => {
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// 4. Analytics: /analytics/overview
router.get('/analytics/overview', (req, res) => {
  const year = req.query.year ? parseInt(req.query.year, 10) : 2025;
  const overview = data.overview[year] || data.overview[2025];
  return res.status(200).json({
    success: true,
    data: overview,
    message: 'Analytics overview retrieved successfully',
  });
});

// 5. Analytics: /analytics/trends
router.get('/analytics/trends', (_req, res) => {
  return res.status(200).json({
    success: true,
    data: data.trends,
    message: 'Historical EV trends retrieved successfully',
  });
});

// 6. Analytics: /analytics/regions
router.get('/analytics/regions', (req, res) => {
  const year = req.query.year ? parseInt(req.query.year, 10) : 2025;
  let list = data.regions[year] || data.regions[2025];
  if (req.query.zone) {
    list = list.filter(r => r.zone.toLowerCase() === String(req.query.zone).toLowerCase());
  }
  return res.status(200).json({
    success: true,
    data: list,
    message: 'State-wise EV analytics retrieved successfully',
  });
});

// 7. Analytics: /analytics/global
router.get('/analytics/global', (req, res) => {
  const year = req.query.year ? parseInt(req.query.year, 10) : 2025;
  const globalData = data.global[year] || data.global[2025];
  return res.status(200).json({
    success: true,
    data: globalData,
    message: 'Global EV benchmarks retrieved successfully',
  });
});

// 8. Analytics: /analytics/manufacturers
router.get('/analytics/manufacturers', (req, res) => {
  const year = req.query.year ? parseInt(req.query.year, 10) : 2025;
  let list = data.manufacturers[year] || data.manufacturers[2025];
  const cat = req.query.categoryCode || req.query.category;
  if (cat) {
    list = list.filter(m => m.categoryCode.toLowerCase() === String(cat).toLowerCase());
  }
  return res.status(200).json({
    success: true,
    data: list,
    message: 'Manufacturer rankings retrieved successfully',
  });
});

// 9. Power BI: /powerbi/reports
router.get('/powerbi/reports', (_req, res) => {
  return res.status(200).json({
    success: true,
    data: data.powerbi,
    message: 'Power BI report suite catalog retrieved successfully',
  });
});

// 10. Power BI: /powerbi/embed-config
router.post('/powerbi/embed-config', (req, res) => {
  const reportId = req.body?.reportId || 'pbi-rep-001-exec';
  return res.status(200).json({
    success: true,
    data: {
      reportId,
      reportName: 'Executive EV Analytics Suite',
      embedUrl: 'https://app.powerbi.com/reportEmbed?reportId=' + reportId,
      embedToken: 'mock_pbi_embed_token_' + Buffer.from(reportId).toString('base64'),
      tokenExpiry: new Date(Date.now() + 3600000).toISOString(),
      isLiveAzure: false,
      nativeFallbackAvailable: true,
      lastRefreshedAt: new Date().toISOString(),
    },
    message: 'Power BI embed configuration generated',
  });
});

// 11. Forecasts: /forecasts
router.get('/forecasts', (_req, res) => {
  return res.status(200).json({
    success: true,
    data: data.forecasts,
    message: 'Statistical forecast models retrieved',
  });
});

router.post('/forecasts/calculate', (_req, res) => {
  return res.status(200).json({
    success: true,
    data: data.forecasts[0] || {},
    message: 'Statistical forecast calculation executed successfully',
  });
});

// 12. Datasets: /datasets
router.get('/datasets', (_req, res) => {
  return res.status(200).json({
    success: true,
    data: data.datasets,
    message: 'Datasets retrieved successfully',
  });
});

// 13. Admin: /admin/users
router.get('/admin/users', (_req, res) => {
  return res.status(200).json({
    success: true,
    data: data.users,
    message: 'Users retrieved successfully',
  });
});

router.patch('/admin/users/:id', (req, res) => {
  const user = data.users.find(u => u.id === req.params.id) || data.users[0];
  const updated = { ...user, ...req.body };
  return res.status(200).json({
    success: true,
    data: updated,
    message: 'User updated successfully',
  });
});

// 14. Admin: /admin/audit-logs
router.get('/admin/audit-logs', (_req, res) => {
  return res.status(200).json({
    success: true,
    data: data.auditLogs,
    message: 'Audit trail logs retrieved',
  });
});

// 15. Admin: /admin/export-csv
router.get('/admin/export-csv', (req, res) => {
  const year = req.query.year ? parseInt(req.query.year, 10) : 2025;
  const list = data.regions[year] || data.regions[2025] || [];

  const headers = [
    'State Code',
    'State Name',
    'Zone',
    'Year',
    'EV Registrations',
    'Total Vehicle Registrations',
    'EV Penetration %',
    'Charging Stations',
  ];

  const rows = list.map(r => [
    `"${r.stateCode}"`,
    `"${r.stateName}"`,
    `"${r.zone}"`,
    r.year,
    r.evRegistrations,
    r.totalVehicleRegistrations,
    r.evPenetrationPct ? Number(r.evPenetrationPct).toFixed(2) : '0.00',
    typeof r.chargingStations === 'object' && r.chargingStations !== null
      ? r.chargingStations.operational || 0
      : Number(r.chargingStations || 0),
  ]);

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const filename = `ev_registrations_export_${year}_${Date.now()}.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.status(200).send(csv);
});

// Mount router under multiple prefixes so rewrites can never fail
app.use('/api/v1', router);
app.use('/v1', router);
app.use('/api', router);
app.use('/', router);

// Central 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;
