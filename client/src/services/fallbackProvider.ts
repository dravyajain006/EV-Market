import fallbackData from './fallbackData.json';

export function getFallbackResponse(url: string, _method = 'get', body?: any) {
  const clean = (url || '').split('?')[0].replace(/\/+$/, '');
  const searchParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
  const yearParam = searchParams.get('year');
  const year = yearParam ? parseInt(yearParam, 10) : 2025;

  if (clean.endsWith('/health')) {
    return {
      status: 'HEALTHY',
      service: 'ev-market-analysis-frontend-fallback',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  if (clean.endsWith('/auth/login')) {
    const email = (body?.email || '').toLowerCase().trim();
    let matchedUser = (fallbackData.users as any[]).find((u) => u.email.toLowerCase() === email);

    if (!matchedUser) {
      if (email.includes('admin') || email.includes('dravya') || email.includes('karan')) {
        matchedUser = {
          id: 'usr_admin_default',
          email: body?.email || 'admindravya@ev',
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

    return {
      success: true,
      data: {
        token: 'local_fallback_token_' + Buffer.from(matchedUser.id).toString('base64'),
        user: matchedUser,
      },
      message: 'Authentication successful (High-Fidelity Local Provider)',
    };
  }

  if (clean.endsWith('/auth/me')) {
    const stored = localStorage.getItem('ev_auth_user');
    const user = stored ? JSON.parse(stored) : fallbackData.users[0];
    return { success: true, data: user };
  }

  if (clean.endsWith('/auth/logout')) {
    return { success: true, message: 'Logged out successfully' };
  }

  if (clean.endsWith('/analytics/overview')) {
    const ov = (fallbackData.overview as any)[year] || (fallbackData.overview as any)[2025];
    return { success: true, data: ov };
  }

  if (clean.endsWith('/analytics/trends')) {
    return { success: true, data: fallbackData.trends };
  }

  if (clean.endsWith('/analytics/regions')) {
    let list = (fallbackData.regions as any)[year] || (fallbackData.regions as any)[2025];
    const zone = searchParams.get('zone');
    if (zone) {
      list = list.filter((r: any) => r.zone.toLowerCase() === zone.toLowerCase());
    }
    return { success: true, data: list };
  }

  if (clean.endsWith('/analytics/global')) {
    const list = (fallbackData.global as any)[year] || (fallbackData.global as any)[2025];
    return { success: true, data: list };
  }

  if (clean.endsWith('/analytics/manufacturers')) {
    let list = (fallbackData.manufacturers as any)[year] || (fallbackData.manufacturers as any)[2025];
    const category = searchParams.get('category') || searchParams.get('categoryCode');
    if (category) {
      list = list.filter((m: any) => m.categoryCode.toLowerCase() === category.toLowerCase());
    }
    return { success: true, data: list };
  }

  if (clean.endsWith('/powerbi/reports')) {
    return { success: true, data: fallbackData.powerbi };
  }

  if (clean.endsWith('/powerbi/embed-config')) {
    const reportId = body?.reportId || 'pbi-rep-001-exec';
    return {
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
    };
  }

  if (clean.endsWith('/forecasts')) {
    return { success: true, data: fallbackData.forecasts };
  }

  if (clean.endsWith('/datasets')) {
    return { success: true, data: fallbackData.datasets };
  }

  if (clean.endsWith('/admin/users')) {
    return { success: true, data: fallbackData.users };
  }

  if (clean.endsWith('/admin/audit-logs')) {
    return { success: true, data: fallbackData.auditLogs };
  }

  return { success: true, data: {} };
}
