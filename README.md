# APILeela — Pine Labs Credit+ API Test Suite

A developer-friendly web interface for **testing, validating, and debugging Pine Labs Credit+ APIs**.  
Handles the full PTS encryption flow (3DES / AES + RSA), OAuth token management, PIN block generation, and request logging — all from a browser.

---

## Project Structure

```
apileela/
├── server.js                  # Express 4 backend — all API routes + crypto logic
├── package.json               # Root package (express, mongodb)
├── config.default.json        # Seed config template (card types, keys, endpoints)
├── test-encryption.js         # Standalone crypto sanity-check script
├── Dockerfile                 # Multi-stage: builds React then serves with Node 18
├── docker-compose.yml         # App + MongoDB (named volume for persistence)
│
├── k8s/
│   └── deployment.yaml        # Kubernetes Deployment + Service manifest
│
└── client/                    # React 18 + Vite + TypeScript frontend
    ├── index.html
    ├── vite.config.ts         # Dev proxy: /api → localhost:3000
    ├── tsconfig.json
    └── src/
        ├── main.tsx           # React root mount
        ├── App.tsx            # Router — maps paths to pages
        ├── theme.ts           # MUI v5 theme (indigo #6366f1, Inter font)
        │
        ├── types/index.ts     # All shared TypeScript interfaces
        │
        ├── api/               # fetch() wrappers (one file per domain)
        │   ├── send.ts
        │   ├── encrypt.ts
        │   ├── decrypt.ts
        │   ├── pin.ts
        │   ├── oauth.ts
        │   ├── logs.ts
        │   └── config.ts
        │
        ├── hooks/
        │   ├── useConfig.ts   # Loads /api/config + /api/oauth/status
        │   └── useSnackbar.ts
        │
        ├── components/
        │   ├── Layout.tsx         # Persistent sidebar + mobile AppBar
        │   ├── CardTypePills.tsx  # Card-type selector tabs
        │   ├── OutputBlock.tsx    # Collapsible accordion for API output
        │   ├── CopyButton.tsx     # Copy-to-clipboard icon button
        │   └── JsonViewer.tsx     # Syntax-highlighted JSON renderer
        │
        └── pages/
            ├── SendRequest/   # Main PTS request builder + response trace
            ├── Encrypt/       # Standalone payload encryptor (DES / AES)
            ├── Decrypt/       # Response decryptor (3DES / AES-CBC)
            ├── PinEncrypt/    # PIN block generator (RSA-wrapped)
            ├── Logs/          # Request history table + detail drawer
            └── Config/        # Card type + key configuration editor
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, MUI v5, React Router v6 |
| **Backend** | Node 18, Express 4 |
| **Database** | MongoDB 7 (config, request logs) |
| **Crypto** | Node `crypto` — 3DES-ECB, AES-CBC, RSA-OAEP, SHA-256 PIN blocks |
| **Auth** | OAuth 2.0 (Bearer token, in-memory cache with auto-refresh) |
| **Container** | Docker multi-stage, docker-compose, Kubernetes |

---

## Running the Application

### Option 1 — Docker (recommended)

The fastest way to get a fully working instance with its own MongoDB:

```bash
docker compose up --build
```

Open **http://localhost:3000**

That's it. The compose file starts MongoDB alongside the app and wires them together automatically. Data persists in a named Docker volume (`mongo_data`).

To stop:

```bash
docker compose down
```

To stop and wipe the database volume:

```bash
docker compose down -v
```

---

### Option 2 — Production build (no Docker)

**Prerequisites:** Node 18+, a running MongoDB instance.

**Step 1 — Install dependencies**

```bash
# Root deps (express, mongodb)
npm install

# Frontend deps
cd client && npm install && cd ..
```

**Step 2 — Build the React frontend**

```bash
npm run build
```

Compiles `client/src/` and outputs the static app to `client-dist/` at the project root.

**Step 3 — Set environment variables**

*PowerShell:*
```powershell
$env:PORT     = "3000"
$env:MONGO_URL = "mongodb://localhost:27017/"
$env:MONGO_DB  = "apileela"
```

*Command Prompt:*
```cmd
set PORT=3000
set MONGO_URL=mongodb://localhost:27017/
set MONGO_DB=apileela
```

*Linux / macOS:*
```bash
export PORT=3000
export MONGO_URL="mongodb://localhost:27017/"
export MONGO_DB="apileela"
```

**Step 4 — Start the server**

```bash
node server.js
```

Open **http://localhost:3000**. Express serves both the React SPA and all `/api` routes from the same port.

**Shortcut (Steps 2 + 4 combined):**

```bash
npm run build:start
```

---

### Option 3 — Local development (hot reload)

Use this when actively changing code — the browser updates instantly without a rebuild.

```bash
# Terminal 1 — API server
node server.js

# Terminal 2 — Vite dev server
cd client && npm run dev
```

- API: **http://localhost:3000**
- UI (hot reload): **http://localhost:5173** — proxies `/api` to `:3000` automatically

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the Express server listens on |
| `MONGO_URL` | `mongodb://mongo:27017/` | MongoDB connection string |
| `MONGO_DB` | `apileela` | Database name |

---

## Dockerfile

Two-stage build — nothing from stage 1 leaks into the final image:

```
Stage 1 (builder)
  └── node:18-alpine
      ├── npm ci  (all deps including dev)
      ├── cd client && npm ci
      └── cd client && npm run build  →  client-dist/

Stage 2 (production)
  └── node:18-alpine
      ├── npm ci --omit=dev
      ├── COPY server.js config.default.json
      └── COPY --from=builder client-dist/
```

```bash
# Build image manually
docker build -t apileela .

# Run with a custom Mongo URL
docker run -p 3000:3000 \
  -e MONGO_URL="mongodb://your-host:27017/" \
  -e MONGO_DB="apileela" \
  apileela
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Blank page at `:3000` | `client-dist/` is missing — run `npm run build` first |
| `MongoServerError` / connection refused | MongoDB isn't running or `MONGO_URL` is wrong — app still starts but API calls return `503` |
| Port already in use | Change `PORT` env var or kill the process using `:3000` |
| `Cannot find module` on `npm install` | Delete `node_modules/` and re-run `npm install` |

---

## API Reference

### Health & Mongo

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check — returns `{ ok, mongo, uptime }` |
| `POST` | `/api/mongo/reconnect` | Force MongoDB reconnect |

### Configuration

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/config` | Get active PTS config (card types, keys, encryption settings) |
| `PUT` | `/api/config` | Update PTS config |
| `POST` | `/api/config/reset` | Reset config to `config.default.json` |

### OAuth

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/oauth/status` | Current token status (expiry, type) |
| `POST` | `/api/oauth/token` | Fetch a new access token |
| `POST` | `/api/oauth/refresh` | Refresh the current token |
| `POST` | `/api/oauth/clear` | Clear the cached token |

### Crypto

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/prepare` | Prepare request timestamp / nonce |
| `POST` | `/api/encrypt` | Encrypt a payload (3DES or AES + RSA key wrapping) |
| `POST` | `/api/decrypt` | Decrypt a response (3DES or AES-CBC) |
| `POST` | `/api/pin/encrypt` | Generate a PIN block + RSA-wrap the session key |

### Send & Logs

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/send` | Encrypt + send a PTS request; log and return full trace |
| `GET` | `/api/logs` | List request logs (pagination, filter by card type) |
| `GET` | `/api/logs/:id` | Get a single log entry |
| `DELETE` | `/api/logs` | Clear all logs |

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Send Request | Build and fire encrypted PTS API calls; see full request/response trace |
| `/encrypt` | Encrypt | Encrypt an arbitrary payload (DES or AES) without sending it |
| `/decrypt` | Decrypt | Decrypt a response ciphertext (3DES or AES-CBC) |
| `/pin` | PIN Encrypt | Generate a PTS-spec PIN block wrapped with RSA |
| `/logs` | Logs | Searchable table of all past requests with expandable details |
| `/config` | Configuration | Edit card types, base URLs, RSA public keys, encryption settings |

---

## Encryption Flow

The backend mirrors `EncryptionProcessor.java` exactly:

```
Payload
  │
  ▼  Pad to 8-byte multiple with 'F'
  │
  ▼  3DES-ECB/NoPadding  →  "data"  (hex or base64)
  │
  ▼  Wrap DES key in ASN.1-like structure
  │
  ▼  RSA-OAEP (SHA-1 / SHA-256 / SHA-512)  →  "encKey"
```

For **AES mode**: AES-128/192/256-CBC with a random IV; key wrapped with RSA-OAEP.

---

## config.default.json

Defines one or more **card types** seeded into MongoDB on first startup:

```json
{
  "cardTypes": {
    "CREDIT": {
      "label": "Credit",
      "baseUrl": "https://api.pinelabs.com/credit/v1",
      "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
      "endpoints": [
        { "path": "/auth/token", "name": "Token", "samples": [] }
      ]
    }
  },
  "encryption": { "algorithm": "DES", "keyLength": 168, "mode": "HEX" },
  "oauth": { "tokenUrl": "...", "username": "...", "apiKey": "..." }
}
```

All subsequent reads/writes go to MongoDB. Use the **Configuration** page in the UI to edit live settings.
