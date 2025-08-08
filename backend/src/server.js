const express = require('express');
const cors = require('cors');
require('dotenv').config();

const recRoutes = require('./routes/recs');
const authRoutes = require('./routes/auth');
const mockDataService = require('./services/mockDataService');
const auth = require('./middleware/auth');
const db = require('./models/database');
const hederaService = require('./services/hederaService');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/recs', recRoutes);

// Hedera config health endpoint
app.get('/api/health/hedera', (req, res) => {
  try {
    const network = process.env.HEDERA_NETWORK || 'testnet';
    const configured = !!hederaService.operatorId;
    const operatorId = configured ? hederaService.operatorId.toString() : null;
    res.json({ network, configured, operatorId });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

app.get('/api/energy/current', (req, res) => {
  const data = mockDataService.generateSolarData();
  res.json(data);
});

app.get('/api/portfolio', async (req, res) => {
  try {
    // If a valid session is provided, return real DB-backed portfolio
    const h = req.headers['authorization'] || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (token) {
      const authStore = require('./services/authStore');
      const s = authStore.getSession(token);
      if (s?.accountId) {
        const recs = await db.getRECsByOwner(s.accountId);
        const stats = {
          totalRECs: recs.length,
          totalMWh: recs.reduce((sum, r) => sum + Number(r.mwh || 0), 0),
          totalSpent: recs.reduce((sum, r) => sum + Number(r.mwh || 0) * Number(r.price || 0), 0),
          carbonOffset: recs.reduce((sum, r) => sum + Number(r.mwh || 0) * 0.4, 0),
        };
        return res.json({ recs, stats });
      }
    }
    // Fallback mock response
    const portfolio = [
      { id: 'rec-1', energy_source: 'solar', location: 'California', mwh: 100, purchase_date: '2024-07-01', status: 'active' },
    ];
    const stats = {
      totalRECs: portfolio.length,
      totalMWh: portfolio.reduce((s, r) => s + r.mwh, 0),
      totalSpent: 4500,
      carbonOffset: 40,
    };
    res.json({ recs: portfolio, stats });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Simple auto-seed: populate a few sample RECs if DB is empty
(async () => {
  try {
    const existing = await db.getAllRECs();
    if (!existing || existing.length === 0) {
      const { v4: uuidv4 } = require('uuid');
      const samples = [
        {
          id: uuidv4(),
          tokenId: null,
          energySource: 'solar',
          location: 'Mojave Desert, CA',
          mwh: 100,
          price: 45,
          generationDate: '2024-07-01',
          ownerId: 'producer-1',
        },
        {
          id: uuidv4(),
          tokenId: null,
          energySource: 'wind',
          location: 'Texas Wind Farm',
          mwh: 150,
          price: 42,
          generationDate: '2024-07-01',
          ownerId: 'producer-2',
        },
        {
          id: uuidv4(),
          tokenId: null,
          energySource: 'hydro',
          location: 'Columbia River Basin',
          mwh: 80,
          price: 39,
          generationDate: '2024-06-15',
          ownerId: 'producer-3',
        },
      ];
      for (const rec of samples) {
        try { await db.createREC(rec); } catch {}
      }
      console.log('Seeded sample RECs into database');
    }
  } catch (e) {
    console.warn('REC auto-seed skipped:', e?.message || e);
  }
})();

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
