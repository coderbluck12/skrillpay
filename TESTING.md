# Skrillpay — Testing Guide

This document explains how to run and test Skrillpay locally and on the live preview site. It covers installing deps, environment variables, running backend/frontend, unit tests, and how to simulate payment webhooks for Korapay (the payment provider used here).

Repository
- GitHub: https://github.com/coderbluck12/skrillpay
- Preview / staging: https://skrillpay-mu.vercel.app

Quick summary
- Backend: TypeScript + Express. Start with `npm run dev` in `backend/`.
- Frontend: Next.js (canary) in `frontend/`. Start with `npm run dev` in `frontend/`.
- Unit tests: Jest is used in both backend and frontend. Run `npm test` inside each folder.

Prerequisites
- Node.js (Recommended LTS: 18.x or 20.x)
- npm (used by this repo; package-lock.json present)
- Git
- ngrok (optional — for webhook testing)
- Korapay sandbox credentials (KORAPAY_PUBLIC_KEY, KORAPAY_SECRET_KEY) or Paystack fallback keys

1) Clone + install

```bash
git clone https://github.com/coderbluck12/skrillpay.git
cd skrillpay
```

Open two terminals (or use your terminal multiplexer): one for backend, one for frontend.

Backend
- Path: ./backend
- Install and run:
  - npm install
  - Copy environment example: `cp backend/.env.example backend/.env` and edit values (see details below)
  - Start dev server:
    ```bash
    cd backend
    npm run dev
    ```
  - Default configured PORT in `backend/.env.example` is 3000.

Frontend
- Path: ./frontend
- Install and run:
  - npm install
  - Start dev server:
    ```bash
    cd frontend
    npm run dev
    ```
  - Next.js default dev port is 3000. Important: backend and frontend both default to port 3000 in the examples — change one to avoid a conflict (see next section).

Handling port conflict (recommended)
- Option A (recommended): Run backend on 4000. Create `backend/.env` and set `PORT=4000` and `API_BASE_URL=http://localhost:4000`. Start backend as above.
- Option B: Run Next on a different port: `npx next dev -p 3001` (or modify start script to `next dev -p 3001`). If you change the port, ensure the frontend uses the correct API base URL.

2) Environment variables (key ones)
From `backend/.env.example` (copy into `backend/.env` and replace placeholders):
- KORAPAY_SECRET_KEY=sk_test_xxx
- KORAPAY_PUBLIC_KEY=pk_test_xxx
- KORAPAY_BASE_URL=https://api.korapay.com/merchant/api/v1
- PAYSTACK_SECRET_KEY (optional fallback)
- DATABASE_URL (Postgres/Neon URL) — for local testing you can use a local Postgres or a dev DB connection string
- PORT (backend port, e.g., 4000)
- NODE_ENV=development
- API_BASE_URL=http://localhost:4000
- JWT_SECRET
- PLATFORM_WEBHOOK_SECRET (used to sign webhooks forwarded to merchants)
- SMTP_* if you want email flows to work (or configure ethereal/dummy SMTP)

Frontend env (create `frontend/.env.local`)
- If frontend requires a public base for API calls, add something like:
  NEXT_PUBLIC_API_URL=http://localhost:4000
- For preview/staging point to the Vercel URL when testing on staging:
  NEXT_PUBLIC_API_URL=https://skrillpay-mu.vercel.app

3) Run unit tests

Backend
- From `backend/` run:
  ```bash
  npm test
  ```
- There is also a helper script `npm run test:standalone` which runs a TypeScript standalone test via ts-node (see `backend/package.json`).
- Jest config: `backend/jest.config.ts`.

Frontend
- From `frontend/` run:
  ```bash
  npm test
  ```
- Jest config: `frontend/jest.config.js` and `frontend/jest.setup.js`.

Notes
- To run tests with more verbose output or watch mode, add jest args, e.g., `npm test -- --watch`.
- To run tests across both packages, run tests in both directories or use a root-level tool (not configured here).

4) Integration & API tests
- Backend likely exposes routes for: /v1/charge, /v1/receipt, webhooks, auth routes.
- Use curl or HTTP client (Postman/Insomnia) to test endpoints. Example:

```bash
curl -X POST http://localhost:4000/v1/charge \
  -H 'Content-Type: application/json' \
  -d '{"amount":100000,"email":"test@example.com","reference":"ORDER_123"}'
```

- For authenticated merchant requests, include `Authorization: Bearer <merchant_api_key>` if required by the project.

5) E2E testing (none configured by default)
- This repo does not include Playwright or Cypress out-of-the-box. To add E2E testing:
  - Install Playwright: `npm i -D @playwright/test` and run `npx playwright test`.
  - Or install Cypress: `npm i -D cypress` and run `npx cypress open`.
- Configure your test baseUrl to point to running frontend (http://localhost:3001 or your chosen port).

6) Testing payment flows (Korapay sandbox)
- Get sandbox keys from Korapay merchant dashboard (or use existing test keys in backend/.env).
- Typical flows to test:
  1. Create a payment session -> returns a checkout URL or session token.
  2. Follow checkout flow in browser -> complete payment with sandbox card or bank options.
  3. Verify customer sees success page and the backend records a paid order.
  4. Simulate asynchronous notifications (webhooks) to ensure webhook handling updates order state.

Simulate webhooks locally with ngrok
1. Start your backend on a public tunnel:
   ngrok http 4000
2. Copy the public ngrok URL (e.g., https://abcd1234.ngrok.io) and set merchant/webhook receiver in Korapay sandbox to `https://abcd1234.ngrok.io/api/webhooks/korapay` (adjust path to match the project route).

Create an HMAC signature (if the project verifies signatures)
- The backend `.env.example` uses `PLATFORM_WEBHOOK_SECRET` (HMAC SHA-512). To simulate a signed webhook, compute signature with Node:

```bash
# Example: compute signature for payload.json
node -e "const fs=require('fs'),crypto=require('crypto'),p=fs.readFileSync('payload.json');console.log(crypto.createHmac('sha512', process.env.PLATFORM_WEBHOOK_SECRET || 'platform_webhook_hmac_secret_change_in_production').update(p).digest('hex'))"
```

Then send curl with header `x-skrillpay-signature` (or `x-korapay-signature` depending on endpoint):

```bash
SIG=the_hmac_from_above
curl -X POST https://abcd1234.ngrok.io/api/webhooks/korapay \
  -H "Content-Type: application/json" \
  -H "x-skrillpay-signature: $SIG" \
  -d @payload.json
```

If the project expects a different header name, check the webhook handler in `backend/src`.

7) Testing receipts & email
- If the app sends emails on payment success, configure SMTP settings in backend `.env` (ethereal for dev) and verify messages are sent.
- For visual receipt verification, open `http://localhost:3001/v1/receipt/ORDER_123` (or the route exposed by the app) after creating a successful payment.

8) Troubleshooting
- Port in use: ensure backend and frontend ports don’t clash.
- Env vars missing: start the server logs will usually show missing var messages.
- Webhooks not triggering: use ngrok and verify Korapay has the correct URL and that any required sig or token is included.
- Database errors: ensure DATABASE_URL is valid or use a local Postgres instance.

9) CI notes
- There is no root-level CI config in the repo. To run tests in CI, add a workflow that runs `npm ci` and `npm test` in both `backend/` and `frontend/` folders. Example steps:
  - Checkout
  - Setup Node
  - Install dependencies in backend
  - Run backend tests
  - Install dependencies in frontend
  - Run frontend tests

10) Useful links
- Repository: https://github.com/coderbluck12/skrillpay
- Live preview: https://skrillpay-mu.vercel.app
- Backend .env example: https://github.com/coderbluck12/skrillpay/blob/main/backend/.env.example
- Backend package.json: https://github.com/coderbluck12/skrillpay/blob/main/backend/package.json
- Frontend package.json: https://github.com/coderbluck12/skrillpay/blob/main/frontend/package.json
- Project architecture & product docs: SKRILLPAY_DOCUMENTATION.md in repo root

If you want, I can:
- Add this file to the repo (I will commit it now as TESTING.md),
- Or instead update an existing docs file. Tell me where you prefer the doc to live.

Done: I added this file to the repository as TESTING.md. If you want changes (formatting, add CI workflow example, or add Playwright/Cypress configs), tell me and I’ll update it.