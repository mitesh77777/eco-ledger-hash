# Eco Ledger — Hedera REC Trading MVP

Mint, trade, and retire Renewable Energy Certificates (RECs) on Hedera testnet with wallet-based authentication and on-chain HTS operations.

## What it is

Eco Ledger is a full‑stack MVP that lets clean‑energy producers mint REC tokens on Hedera, list them on a marketplace, and lets buyers purchase and retire RECs. It includes wallet connect + message signing auth, a marketplace, producer tools, a portfolio, and a simple energy dashboard.

## Key features

- Wallet connect and sign-in
	- WalletConnect v2 (SignClient + Modal) with auto-auth on connect
	- HashPack supported via WC; Blade recommended for the smoothest WC experience
- On-chain HTS flows (testnet)
	- Mint fungible REC tokens (decimals=0)
	- Purchase transfers with token-association guidance
	- Retire tokens (wipe/burn fallback)
- Marketplace UI
	- Browse, filter by source, purchase with association retry
- Producer tools
	- Mint REC form and energy output snapshot
- Portfolio
	- Holdings, stats, retire flow
- Backend persistence
	- SQLite for RECs and transactions; auto-seed sample RECs for demo

## Tech stack

- Frontend: React 18 + Vite + TypeScript, Tailwind, shadcn/ui (Radix), React Router
- Wallet: WalletConnect v2 (SignClient + Modal)
- Charts/UX: Recharts, Sonner toasts
- Backend: Node.js, Express, SQLite3
- Hedera: @hashgraph/sdk for HTS; Mirror Node for account pubkey
- Auth: Nonce + message signing (tweetnacl verify for ED25519)

## Architecture

- frontend (Vite) proxies /api → backend during dev
- backend exposes auth, RECs, energy, and portfolio endpoints
- auth flow: client fetches nonce → wallet signs → server verifies signature against Mirror Node pubkey → session token
- REC lifecycle: mint → list → purchase (transfer) → retire (wipe/burn)

## Repo layout

- backend/
	- src/server.js — Express app, routes and health endpoints
	- src/routes/* — auth, recs
	- src/controllers/* — authController, recController
	- src/models/database.js — SQLite schema and queries
	- src/services/* — hederaService, authStore, mockDataService
	- data/recs.db — local SQLite database (gitignored)
- src/
	- hooks/useHedera.tsx — WalletConnect integration + auto-auth
	- components/* — marketplace, producer tools, wallet button, UI primitives
	- pages/* — Index, Portfolio, Impact, NotFound
	- services/* — api.ts, auth.ts
	- App.tsx, main.tsx, index.css

## Getting started

Prereqs: Node 18+, npm, a Hedera testnet account with ED25519 key, a mobile wallet (Blade recommended for WalletConnect).

1) Install deps

```bash
npm install
(cd backend && npm install)
```

2) Configure env

- Create backend/.env (never commit secrets):

```properties
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.xxxx
HEDERA_PRIVATE_KEY=your-private-key
PORT=3001
```

- Create .env.local (optional) for frontend:

```bash
# WalletConnect Project ID; defaults to example id if unset
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
# If serving backend on a different host, set the API base
# VITE_API_URL=https://your-backend-host
```

3) Run dev servers

```bash
# terminal A
cd backend
npm run start

# terminal B (in project root)
npm run dev
```

- Frontend: http://localhost:8080 (Vite may pick 8081–8083)
- Backend: http://localhost:3001

## Wallet & authentication

- Click Connect Wallet and approve the WalletConnect session in your wallet.
- Auto-auth: the app requests a login signature immediately after connect; approve the message.
- If using HashPack desktop, ensure WalletConnect is enabled in the extension. For a smoother WC flow, use Blade (iOS/Android).
- Keep the app tab focused when approving to avoid deep-link skips.

## On-chain flows

- Mint: Producer creates a new REC token (HTS fungible, decimals 0). The backend stores the REC with tokenId.
- Purchase: Transfers tokens from treasury/owner to buyer. If not associated, the API returns 409 with tokenId — associate in wallet and retry from the UI.
- Retire: Wipes from owner or burns from treasury on fallback, then marks the REC retired in DB.

## API

- GET /api/health — { ok: true }
- GET /api/health/hedera — { network, configured, operatorId }
- GET /api/recs — list available RECs
- POST /api/recs/mint — mint a REC (auth required)
- POST /api/recs/:id/purchase — purchase (auth required)
- POST /api/recs/:id/retire — retire (auth required)
- GET /api/energy/current — mock energy snapshot
- GET /api/portfolio — portfolio (uses session when provided)

Auth endpoints

- GET /api/auth/nonce?accountId=0.0.x — issue nonce
- POST /api/auth/verify — { accountId, signature } → session token

## Hackathon notes

- Auto-seeding: If DB is empty, backend seeds a few sample RECs so the marketplace renders immediately.
- Dev proxy: Vite proxies /api → http://localhost:3001; frontend also supports VITE_API_URL for hosted backends.
- WC Verify CSP: index.html allows verify.walletconnect.org in script/frame for sign flow UX.

## Security

- Do not commit secrets. backend/.env and backend/data are gitignored. If you previously pushed keys, rotate them immediately in your wallet.
- Session tokens are opaque and stored in localStorage for this MVP.

## Limitations & next steps

- HashPack over WalletConnect can be flaky in desktop; a direct HashConnect path can be added for stability.
- ECDSA account keys are not yet supported in server-side verification; ED25519 is required.
- Pricing/listing/orderbook is simplified; consider a real marketplace + custody model.

## License

MIT

