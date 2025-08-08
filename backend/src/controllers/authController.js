const authStore = require('../services/authStore');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const nacl = require('tweetnacl');

// Simple Mirror Node lookup for an account's public key
async function getAccountPublicKey(accountId) {
  const network = (process.env.HEDERA_NETWORK || 'testnet').toLowerCase();
  const base = network === 'mainnet' ? 'https://mainnet.mirrornode.hedera.com' : network === 'previewnet' ? 'https://previewnet.mirrornode.hedera.com' : 'https://testnet.mirrornode.hedera.com';
  const res = await fetch(`${base}/api/v1/accounts/${accountId}`);
  if (!res.ok) throw new Error(`Mirror node error ${res.status}`);
  const data = await res.json();
  const raw = data?.key?.key || data?.key?.ecdsa_secp256k1 || data?.key?.ed25519;
  const type = data?.key?.ed25519 ? 'ed25519' : data?.key?.ecdsa_secp256k1 ? 'ecdsa' : 'unknown';
  if (!raw) throw new Error('Public key not found');
  return { key: raw, type }; // base64
}

function verifyEd25519(message, signatureAny, pubKeyBase64) {
  const msg = new TextEncoder().encode(message);
  // Accept hex or base64 signatures
  let sig;
  try {
    if (typeof signatureAny === 'string' && /^[0-9a-fA-F]+$/.test(signatureAny)) {
      sig = Buffer.from(signatureAny, 'hex');
    } else if (typeof signatureAny === 'string') {
      sig = Buffer.from(signatureAny, 'base64');
    } else if (signatureAny?.signature) {
      const v = signatureAny.signature;
      sig = /^[0-9a-fA-F]+$/.test(v) ? Buffer.from(v, 'hex') : Buffer.from(v, 'base64');
    } else {
      throw new Error('Unsupported signature format');
    }
  } catch (e) {
    throw new Error('Invalid signature encoding');
  }
  const pub = Buffer.from(pubKeyBase64, 'base64');
  return nacl.sign.detached.verify(new Uint8Array(msg), new Uint8Array(sig), new Uint8Array(pub));
}

class AuthController {
  async getNonce(req, res) {
    try {
      const { accountId } = req.query;
      if (!accountId) return res.status(400).json({ error: 'accountId required' });
      const { nonce, expiresAt } = authStore.createNonce(accountId);
      res.json({ nonce, expiresAt });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  async verify(req, res) {
    try {
      const { accountId, signature } = req.body;
      if (!accountId || !signature) return res.status(400).json({ error: 'accountId and signature required' });
      const nonce = authStore.consumeNonce(accountId);
      if (!nonce) return res.status(400).json({ error: 'Invalid or expired nonce' });

      // Message format must match the client message exactly
      const message = `EcoLedger Login\nAccount: ${accountId}\nNonce: ${nonce}`;
      const { key: pubKey, type } = await getAccountPublicKey(accountId);

      if (type !== 'ed25519') {
        return res.status(400).json({ error: 'Unsupported key type', message: 'This account is not ED25519. Use an ED25519 account or update server to support ECDSA.' });
      }
      const ok = verifyEd25519(message, signature, pubKey);
      if (!ok) return res.status(401).json({ error: 'Signature verification failed' });

      const session = authStore.createSession(accountId);
      res.json({ token: session.token, accountId, expiresAt: session.expiresAt });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
}

module.exports = new AuthController();
