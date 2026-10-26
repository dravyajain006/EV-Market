const url = require('url');
const data = require('./data.json');

// Helper to send JSON responses with universal CORS headers
function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(body));
}

// Parse request body for POST/PATCH
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.end();
  }

  const reqUrl = new URL(req.url || '/', 'http://localhost');
  const pathname = reqUrl.pathname || '';
  const query = Object.fromEntries(reqUrl.searchParams.entries());
  const cleanPath = pathname.replace(/\/+$/, '');

  // 1. Health check
  if (cleanPath === '/health' || cleanPath === '/api/health' || cleanPath.endsWith('/health')) {
    return sendJson(res, 200, {
      status: 'HEALTHY',
      service: 'ev-market-analysis-backend',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'vercel-serverless',
    });
  }

  // 2. Authentication: /auth/login
  if (cleanPath.endsWith('/auth/login') && req.method === 'POST') {
    const body = await parseBody(req);
    const email = (body.email || '').toLowerCase().trim();

    let matchedUser = data.users.find(u => u.email.toLowerCase() === email);
    if (!matchedUser) {
      if (email.includes('admin') || email.includes('dravya') || email.includes('karan')) {
        matchedUser = {
          id: 'usr_admin_default',
          email: body.email || 'admindravya@ev',
          fullName: email.includes('karan') ? 'Karan Raikwar' : 'Dravya Jain',
          role: 'ADMIN',
          department: 'Executive Mobility Strategy & Administration',
          isActive: true
        };
      } else if (email.includes('viewer')) {
        matchedUser = {
          id: 'usr_viewer_default',
          email: 'viewer@evmarket.internal',
          fullName: 'Ananya Verma (Industry Auditor)',
          role: 'VIEWER',
          department: 'Compliance & Academic Review',
          isActive: true
        };
      } else {
        matchedUser = {
          id: 'usr_analyst_default',
          email: 'analyst@evmarket.internal',
          fullName: 'Priya Sundaram (Senior BI Analyst)',
          role: 'ANALYST',
          department: 'Market Intelligence & Forecasting',
          isActive: true
        };
      }
    }

    const token = 'mock_jwt_' + Buffer.from(JSON.stringify({ id: matchedUser.id, role: matchedUser.role })).toString('base64');
    return sendJson(res, 200, {
      success: true,
      data: {
        token,
        user: matchedUser
      },
      message: 'Authentication successful'
    });
  }

  // 3. Authentication: /auth/me
  if (cleanPath.endsWith('/auth/me')) {
    const authHeader = req.headers.authorization || '';
    let user = data.users[0];
    if (authHeader.includes('ADMIN')) {
      user = data.users.find(u => u.role === 'ADMIN') || data.users[0];
    }
    return sendJson(res, 200, {
      success: true,
      data: user,
      message: 'Authenticated user profile'
    });
  }

  // 4. Authentication: /auth/logout
  if (cleanPath.endsWith('/auth/logout')) {
    return sendJson(res, 200, { success: true, message: 'Logged out successfully' });
  }

  // 5. Analytics: /analytics/overview
  if (cleanPath.endsWith('/analytics/overview')) {
    const year = query.year ? parseInt(query.year, 10) : 2025;
    const overview = data.overview[year] || data.overview[2025];
    return sendJson(res, 200, {
      success: true,
      data: overview,
      message: 'Analytics overview retrieved successfully'
    });
  }

  // 6. Analytics: /analytics/trends
  if (cleanPath.endsWith('/analytics/trends')) {
    return sendJson(res, 200, {
      success: true,
      data: data.trends,
      message: 'Historical EV trends retrieved successfully'
    });
  }

  // 7. Analytics: /analytics/regions
  if (cleanPath.endsWith('/analytics/regions')) {
    const year = query.year ? parseInt(query.year, 10) : 2025;
    let list = data.regions[year] || data.regions[2025];
    if (query.zone) {
      list = list.filter(r => r.zone.toLowerCase() === String(query.zone).toLowerCase());
    }
    return sendJson(res, 200, {
      success: true,
      data: list,
      message: 'State-wise EV analytics retrieved successfully'
    });
  }

  // 8. Analytics: /analytics/global
  if (cleanPath.endsWith('/analytics/global')) {
    const year = query.year ? parseInt(query.year, 10) : 2025;
    const globalData = data.global[year] || data.global[2025];
    return sendJson(res, 200, {
      success: true,
      data: globalData,
      message: 'Global EV benchmarks retrieved successfully'
    });
  }

  // 9. Analytics: /analytics/manufacturers
  if (cleanPath.endsWith('/analytics/manufacturers')) {
    const year = query.year ? parseInt(query.year, 10) : 2025;
    let list = data.manufacturers[year] || data.manufacturers[2025];
    if (query.categoryCode) {
      list = list.filter(m => m.categoryCode.toLowerCase() === String(query.categoryCode).toLowerCase());
    }
    return sendJson(res, 200, {
      success: true,
      data: list,
      message: 'Manufacturer rankings retrieved successfully'
    });
  }

  // 10. Power BI: /powerbi/reports
  if (cleanPath.endsWith('/powerbi/reports')) {
    return sendJson(res, 200, {
      success: true,
      data: data.powerbi,
      message: 'Power BI report suite catalog retrieved successfully'
    });
  }

  // 11. Power BI: /powerbi/embed-config
  if (cleanPath.endsWith('/powerbi/embed-config')) {
    const body = await parseBody(req);
    const reportId = body.reportId || 'pbi-rep-001-exec';
    return sendJson(res, 200, {
      success: true,
      data: {
        reportId,
        reportName: 'Executive EV Analytics Suite',
        embedUrl: 'https://app.powerbi.com/reportEmbed?reportId=' + reportId,
        embedToken: 'mock_pbi_embed_token_' + Buffer.from(reportId).toString('base64'),
        tokenExpiry: new Date(Date.now() + 3600000).toISOString(),
        isLiveAzure: false,
        nativeFallbackAvailable: true,
        lastRefreshedAt: new Date().toISOString()
      },
      message: 'Power BI embed configuration generated'
    });
  }

  // 12. Forecasts: /forecasts
  if (cleanPath.endsWith('/forecasts')) {
    return sendJson(res, 200, {
      success: true,
      data: data.forecasts,
      message: 'Statistical forecast models retrieved'
    });
  }

  // 13. Datasets: /datasets
  if (cleanPath.endsWith('/datasets')) {
    return sendJson(res, 200, {
      success: true,
      data: data.datasets,
      message: 'Datasets retrieved successfully'
    });
  }

  // 14. Admin: /admin/users
  if (cleanPath.endsWith('/admin/users')) {
    return sendJson(res, 200, {
      success: true,
      data: data.users,
      message: 'Users retrieved successfully'
    });
  }

  // 15. Admin: /admin/audit-logs
  if (cleanPath.endsWith('/admin/audit-logs')) {
    return sendJson(res, 200, {
      success: true,
      data: data.auditLogs,
      message: 'Audit trail logs retrieved'
    });
  }

  // Catch-all
  return sendJson(res, 200, {
    success: true,
    data: {},
    message: 'EV Market Analytics Serverless API'
  });
};
