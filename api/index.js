let handler;

module.exports = async (req, res) => {
  if (!handler) {
    const app = require('../dist/main');
    handler = app.default;
  }
  return handler(req, res);
};
