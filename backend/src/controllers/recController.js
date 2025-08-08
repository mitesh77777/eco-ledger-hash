const db = require('../models/database');
const hederaService = require('../services/hederaService');
const { v4: uuidv4 } = require('uuid');

class RECController {
  async getAllRECs(req, res) {
    try {
      const recs = await db.getAllRECs();
      res.json(recs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async mintREC(req, res) {
    try {
  const { energySource, location, mwh, price, generationDate, ownerId } = req.body;
      if (!hederaService.operatorId) {
        return res.status(503).json({ error: 'Hedera not configured', message: 'Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in backend/.env' });
      }
      const tokenName = `REC-${energySource?.toUpperCase?.() || 'GEN'}-${Date.now()}`;
      const tokenSymbol = `R${(energySource || 'X')[0].toUpperCase()}`;
      const tokenId = await hederaService.createRECToken(tokenName, tokenSymbol, Number(mwh));

      const recData = {
        id: uuidv4(),
        tokenId,
        energySource,
        location,
        mwh: Number(mwh),
        price: Number(price),
        generationDate,
        ownerId: (hederaService.operatorId && hederaService.operatorId.toString()) || ownerId || 'producer-1',
      };

      await db.createREC(recData);

      res.json({ success: true, rec: recData, tokenId, transactionId: `mint-${Date.now()}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async purchaseREC(req, res) {
    try {
  const { id } = req.params;
  const buyerId = req.user?.accountId || req.body?.buyerId;
  if (!buyerId) return res.status(400).json({ error: 'buyerId required' });
      if (!hederaService.operatorId) {
        return res.status(503).json({ error: 'Hedera not configured', message: 'Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in backend/.env' });
      }

      const rec = await db.getRECById(id);
      if (!rec) return res.status(404).json({ error: 'REC not found' });

      // Attempt on-chain transfer. If token not associated, return a hint to associate first.
      let txId = null;
      try {
        const xfer = await hederaService.transferREC(rec.token_id, rec.owner_id || hederaService.operatorId?.toString(), buyerId, Number(rec.mwh));
        txId = xfer.transactionId;
      } catch (e) {
        console.warn('Transfer failed, likely association missing:', e?.message);
        return res.status(409).json({ error: 'TOKEN_NOT_ASSOCIATED', message: 'Associate the token in your wallet, then retry purchase.', tokenId: rec.token_id });
      }

      await db.updateRECOwner(id, buyerId);
      await db.createTransaction({
        id: uuidv4(),
        recId: id,
        buyerId,
        sellerId: rec.owner_id,
        amount: Number(rec.price) * Number(rec.mwh),
        hederaTxId: txId || `transfer-${Date.now()}`,
      });

      res.json({ success: true, transactionId: txId, message: 'REC purchased successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async retireREC(req, res) {
    try {
      const { id } = req.params;
      const rec = await db.getRECById(id);
      if (!rec) return res.status(404).json({ error: 'REC not found' });
      // Attempt to wipe from current owner, falling back to burn from treasury if needed
      try {
        await hederaService.wipeTokens(rec.token_id, rec.owner_id, Number(rec.mwh));
      } catch (e) {
        console.warn('Wipe failed, trying burn from treasury:', e?.message);
        await hederaService.burnTokens(rec.token_id, Number(rec.mwh));
      }
      await db.updateRECStatus(id, 'retired');
      res.json({ success: true, message: 'REC retired on-chain and marked as retired' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new RECController();
