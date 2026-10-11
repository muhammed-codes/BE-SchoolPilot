let handler;

module.exports = async (req, res) => {
  try {
    if (!handler) {
      console.log('[Vercel Serverless] Initializing NestJS backend...');
      const app = require('../dist/main');
      handler = app.default;
    }
    return await handler(req, res);
  } catch (error) {
    console.error('[Vercel Serverless Error]:', error);
    if (!res.headersSent) {
      res.status(500).json({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Unknown serverless initialization error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }
};
