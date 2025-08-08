const {
  AccountId,
  Client,
  PrivateKey,
  TokenCreateTransaction,
  TokenSupplyType,
  TokenType,
  TransferTransaction,
  TokenWipeTransaction,
  TokenBurnTransaction,
} = require('@hashgraph/sdk');

class HederaService {
  constructor() {
    const network = process.env.HEDERA_NETWORK || 'testnet';
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;

    if (!accountId || !privateKey) {
      console.warn('[hederaService] Missing env vars. On-chain operations will fail.');
    }

    this.client = network === 'mainnet' ? Client.forMainnet() : network === 'previewnet' ? Client.forPreviewnet() : Client.forTestnet();
    if (accountId && privateKey) {
      try {
        this.operatorId = AccountId.fromString(accountId);
        this.operatorKey = PrivateKey.fromString(privateKey);
        this.client.setOperator(this.operatorId, this.operatorKey);
      } catch (e) {
        console.warn('[hederaService] Invalid Hedera credentials in env; continuing without operator:', e?.message || e);
        this.operatorId = undefined;
        this.operatorKey = undefined;
      }
    }
  }

  async createRECToken(name, symbol, initialSupply) {
    if (!this.operatorId) throw new Error('Hedera operator not configured');

    const tx = new TokenCreateTransaction()
      .setTokenName(name)
      .setTokenSymbol(symbol)
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(0)
      .setInitialSupply(initialSupply)
      .setTreasuryAccountId(this.operatorId)
      .setSupplyType(TokenSupplyType.Infinite)
      .setSupplyKey(this.operatorKey)
      .setWipeKey(this.operatorKey);

    const resp = await tx.execute(this.client);
    const receipt = await resp.getReceipt(this.client);
    return receipt.tokenId.toString();
  }

  async transferREC(tokenId, fromAccountId, toAccountId, amount) {
    if (!this.operatorId) throw new Error('Hedera operator not configured');
    const tx = new TransferTransaction()
      .addTokenTransfer(tokenId, fromAccountId, -amount)
      .addTokenTransfer(tokenId, toAccountId, amount)
      .freezeWith(this.client)
      .sign(this.operatorKey);

    const resp = await tx.execute(this.client);
    const receipt = await resp.getReceipt(this.client);
    return { transactionId: resp.transactionId.toString(), status: receipt.status.toString() };
  }

  async wipeTokens(tokenId, accountId, amount) {
    if (!this.operatorId) throw new Error('Hedera operator not configured');
    const tx = new TokenWipeTransaction()
      .setTokenId(tokenId)
      .setAccountId(accountId)
      .setAmount(amount)
      .freezeWith(this.client)
      .sign(this.operatorKey);
    const resp = await tx.execute(this.client);
    const receipt = await resp.getReceipt(this.client);
    return { transactionId: resp.transactionId.toString(), status: receipt.status.toString() };
  }

  async burnTokens(tokenId, amount) {
    if (!this.operatorId) throw new Error('Hedera operator not configured');
    const tx = new TokenBurnTransaction()
      .setTokenId(tokenId)
      .setAmount(amount)
      .freezeWith(this.client)
      .sign(this.operatorKey);
    const resp = await tx.execute(this.client);
    const receipt = await resp.getReceipt(this.client);
    return { transactionId: resp.transactionId.toString(), status: receipt.status.toString() };
  }
}

module.exports = new HederaService();
