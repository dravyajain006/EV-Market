const path = require('path');

// Dynamic loader with fallback for serverless runtime
let app;
try {
  app = require('../server/dist/app.js').default;
} catch (error) {
  console.warn('Relative import failed, trying cwd-based path:', error.message);
  try {
    app = require(path.join(process.cwd(), 'server', 'dist', 'app.js')).default;
  } catch (err2) {
    console.error('Failed to load server application:', err2);
  }
}

module.exports = (req, res) => {
  if (!app) {
    return res.status(500).json({
      success: false,
      message: 'EV Market Analytics Serverless API could not be initialized.',
      timestamp: new Date().toISOString(),
    });
  }
  return app(req, res);
};
