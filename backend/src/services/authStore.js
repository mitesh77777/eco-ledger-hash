const crypto = require('crypto');

class AuthStore {
  constructor() {
    this.nonces = new Map(); // accountId -> { nonce, expiresAt }
    this.sessions = new Map(); // token -> { accountId, expiresAt }
  }

  createNonce(accountId) {
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 5 * 60 * 1000;
    this.nonces.set(accountId, { nonce, expiresAt });
    return { nonce, expiresAt };
  }

  consumeNonce(accountId) {
    const entry = this.nonces.get(accountId);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.nonces.delete(accountId);
      return null;
    }
    this.nonces.delete(accountId);
    return entry.nonce;
  }

  createSession(accountId) {
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h
    this.sessions.set(token, { accountId, expiresAt });
    return { token, expiresAt };
  }

  getSession(token) {
    const s = this.sessions.get(token);
    if (!s) return null;
    if (Date.now() > s.expiresAt) {
      this.sessions.delete(token);
      return null;
    }
    return s;
  }
}

module.exports = new AuthStore();
