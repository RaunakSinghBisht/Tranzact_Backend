# 🏦 Tranzact — Backend

A full-stack **banking ledger system** built with the MERN stack, designed around real-world banking principles rather than a typical CRUD app — double-entry accounting, idempotent transactions, atomic money movement, and role-based access control.

> This repository contains the **backend API**. Built with Node.js, Express, and MongoDB.

---

## 📖 About

Tranzact isn't just "add and subtract a balance field." It treats money movement the way real banking systems do:

- Balances are never stored — they're **derived** from an immutable ledger of credits and debits.
- Every transaction is **idempotent** — retrying a request (e.g. after a network failure) never double-charges anyone.
- Debit and credit entries are written **atomically** using MongoDB sessions — either both happen, or neither does.
- Ledger entries, once written, **cannot be modified or deleted** — mistakes are reversed, never edited, just like a real accounting ledger.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **JWT Auth (httpOnly cookies)** | Tokens are never exposed to JS — mitigates XSS-based token theft |
| 🧾 **Double-Entry Ledger** | Every transaction = one `DEBIT` + one `CREDIT` entry; balance = `SUM(credits) − SUM(debits)` |
| 🔁 **Idempotency Keys** | Prevents duplicate transactions caused by retries/network glitches |
| ⚛️ **Atomic Transactions** | MongoDB sessions ensure debit + credit + status update succeed or fail together |
| 🛡️ **Role-Based Access** | `isSystemUser` flag gates system-level actions like cash deposits |
| 🚫 **Immutable Ledger** | Schema-level hooks block updates/deletes on ledger entries |
| 🧹 **Token Blacklisting** | Logout blacklists the JWT server-side (TTL-indexed, auto-expires) instead of just clearing a cookie |
| 📄 **PDF Statements** | Generates downloadable transaction history PDFs for a given date range |
| 📧 **Email Notifications** | Sends registration, transaction success, and transaction failure emails via Gmail OAuth2 |
| 🌐 **Locked-Down CORS** | Only the deployed frontend origin is whitelisted, with credentialed cookies enabled |

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB + Mongoose |
| Auth | JWT (`jsonwebtoken`) + `httpOnly` cookies (`cookie-parser`) |
| Password Hashing | `bcryptjs` |
| Validation | `express-validator` |
| Email | `nodemailer` (Gmail OAuth2) |
| PDF Generation | `pdfkit` |
| Cross-Origin Handling | `cors` |
| Config | `dotenv` |
| Dev Tooling | `nodemon` |

---

## 🏗️ Core Flow: How a Transaction Actually Works

```
POST /api/transactions
        │
        ▼
1. Validate request body (sender, receiver, amount, idempotencyKey)
        │
        ▼
2. Check idempotencyKey — has this exact transaction already been tried?
   ├── COMPLETED → return existing result (no duplicate transfer)
   ├── PENDING   → tell client it's still processing
   └── FAILED/REVERSED → reject, ask to retry with a new key
        │
        ▼
3. Confirm both accounts are ACTIVE (not FROZEN/CLOSED)
        │
        ▼
4. Derive sender's balance from the ledger (not a stored field)
   └── Insufficient balance? → reject + send failure email
        │
        ▼
5. Create transaction record → status: PENDING
        │
        ▼
6. Start MongoDB session/transaction
   ├── Write DEBIT ledger entry (sender)
   └── Write CREDIT ledger entry (receiver)
        │
        ▼
7. Mark transaction COMPLETED, commit session
   (if anything above fails → abort session, mark transaction FAILED)
        │
        ▼
8. Respond to client + fire email notification (success/failure)
```

This same debit/credit/session pattern powers `cashDepositController`, used by **system users** to inject funds into a regular account (e.g. simulating an ATM/branch deposit) without needing a real "from" user account.

---

## 📡 API Reference

Base URL: `/api`

### Auth — `/api/auth`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/register` | ❌ | Create a new user, hash password, issue JWT cookie |
| `POST` | `/login` | ❌ | Verify credentials, issue JWT cookie |
| `POST` | `/logout` | ❌ | Blacklist current token, clear cookie |
| `GET` | `/isLoggedIn` | ✅ Token | Returns current user if token is valid |

### Accounts — `/api/accounts`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/` | ✅ Token | Create a new account for the logged-in user |
| `GET` | `/` | ✅ Token | Get all accounts belonging to the logged-in user |
| `GET` | `/balance/:accountId` | ✅ Token (owner only) | Get derived balance for an account |
| `GET` | `/getLedger/:accountId` | ✅ Token (owner only) | Get all ledger entries (with transaction details) for an account |

### Transactions — `/api/transactions`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/` | ✅ Token (sender = owner) | Transfer funds between two accounts (idempotent, atomic) |
| `POST` | `/cashDeposit` | ✅ System User only | Deposit funds into an account (bank-side operation) |
| `GET` | `/history/:accountId` | ✅ Token (owner only) | Get full transaction history for an account |
| `POST` | `/historyPDF` | ✅ Token (owner only) | Generate & download a PDF statement for a date range |
| `GET` | `/systemDepositHistory/:accountId` | ✅ System User only | Get all system-deposit transactions for an account |

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Returns `"Server is Running..."` — useful for uptime pings on Render |

---

## 🗂️ Project Structure

```
Tranzact_Backend/
├── server.js                 # Entry point — connects DB, starts server
├── src/
│   ├── app.js                 # Express app config, middleware, route mounting
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── account.controller.js
│   │   └── transaction.controller.js
│   ├── middlewares/
│   │   └── auth.middleware.js  # verifyToken + isSystemUser (role-based gate)
│   ├── models/
│   │   ├── user.model.js
│   │   ├── account.model.js
│   │   ├── ledger.model.js     # immutable double-entry ledger
│   │   ├── transaction.model.js
│   │   └── tokenBlacklist.model.js
│   ├── routes/
│   │   ├── auth.route.js
│   │   ├── account.route.js
│   │   └── transaction.route.js
│   └── services/
│       └── email.service.js    # Nodemailer + Gmail OAuth2 templates
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=production

# Gmail OAuth2 (for email service)
EMAIL_USER=your_gmail_address
CLIENT_ID=your_google_oauth_client_id
CLIENT_SECRET=your_google_oauth_client_secret
REFRESH_TOKEN=your_google_oauth_refresh_token
```

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/RaunakSinghBisht/Tranzact_Backend.git
cd Tranzact_Backend

# Install dependencies
npm install

# Set up your .env file (see above)

# Run in dev mode (auto-restart on changes)
npm run dev

# Run in production
npm start
```

Server runs on `http://localhost:3000` by default.

---

## 🔒 Security Notes

- Passwords are hashed with `bcryptjs` before storage — never stored or returned in plain text.
- JWTs are stored in **httpOnly, secure, `SameSite=None`** cookies — required for the cross-origin setup (Vercel frontend ↔ Render backend) and inaccessible to client-side JS.
- CORS is locked to a single explicit origin with `credentials: true` — no wildcard (`*`) access.
- Logout blacklists the token server-side rather than relying solely on the client discarding it.

---

## 🛣️ Possible Next Steps

- Rate-limiting on sensitive routes (login, transactions, PDF export)
- Refresh token rotation
- Admin dashboard for system users
- Webhook/audit-log export

---

## 👤 Author

**Raunak Singh Bisht**
Building Tranzact as a hands-on deep dive into full-stack development and real-world banking system design.
