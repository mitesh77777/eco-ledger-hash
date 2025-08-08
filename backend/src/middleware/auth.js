const authStore = require('../services/authStore');

module.exports = function auth(req, res, next) {
  const h = req.headers['authorization'] || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const s = authStore.getSession(token);
  if (!s) return res.status(401).json({ error: 'Invalid session' });
  req.user = { accountId: s.accountId };
  next();
};
