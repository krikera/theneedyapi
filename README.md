# The Needy API (DB-Gotchi)
> "An enterprise-grade affective digital companion and state machine with severe relational abandonment issues."

---

## Overview

A digital pet backend built with Node.js, Express, and MongoDB. It tracks when you last interacted with it, gets hungrier over time, and demands regular attention. Leave it alone past the abandonment threshold, and it blocks requests with `403 Forbidden`. Let hunger hit 100%, and it deletes a database document to survive.

---

## Architecture & Directory Structure

```
theneedyapi/
├── .env                  # Environment parameters (Thresholds, DB URI, Port)
├── .env.example          # Template environment config
├── .gitignore            # Git exclusion rules
├── package.json          # Dependencies & scripts
├── README.md             # Architecture documentation & API testing guide
└── src/
    ├── app.js            # Express app configuration & middleware pipeline
    ├── server.js         # HTTP server entrypoint & graceful shutdown
    ├── config/
    │   └── db.js         # MongoDB connection & lifecycle management
    ├── models/
    │   ├── ServerState.js   # Singleton state tracking interaction, hunger, anger
    │   ├── Grudge.js        # Audit log of rejected apologies
    │   └── UserResource.js  # Pantry documents & emergency nutritional reserves
    ├── middleware/
    │   ├── abandonmentMiddleware.js # Intercepts neglected traffic (403 Forbidden)
    │   ├── rateLimiter.js           # Traffic throttling and DoS protection
    │   └── validate.js              # Zod request validation middleware
    ├── validation/
    │   └── schemas.js               # Zod request schemas
    ├── services/
    │   └── hungerService.js         # Metabolic background daemon ticking hunger
    ├── controllers/
    │   ├── petController.js         # Apology, feeding, status, & grudge controllers
    │   └── dataController.js        # Resource CRUD & Data Eater cannibalization
    ├── routes/
    │   ├── petRoutes.js             # /api/apologize, /api/feed, /api/status, /api/grudges
    │   └── dataRoutes.js            # /api/data routes
    ├── docs/
    │   └── openapi.js               # OpenAPI 3.1 specification & interactive Scalar docs
    ├── tests/
    │   └── testSuite.test.js        # Native node:test suite with safe canary fixture
    └── scripts/
        └── seedData.js              # Provisions fresh pantry data & resets mood
```

---

## Core Mechanics

### 1. Data Model
- `ServerState` (Singleton): Tracks `lastInteraction` timestamp, `hungerLevel` (0 to 100), and `isAngry` state.
- `Grudge`: Audit log of insincere apologies (`apologyText`, `wordCount`, `rejectionReason`, `timestamp`).
- `UserResource`: Business documents stored in the database pantry. If the pet starves, it consumes these records.

### 2. Abandonment Middleware
- Runs on every incoming request.
- Checks dormancy: `Date.now() - state.lastInteraction`.
- If inactive longer than `ABANDONMENT_THRESHOLD_MS`, sets `state.isAngry = true`.
- While angry, all endpoints return `403 Forbidden` except `POST /api/apologize` and documentation routes (`/`, `/docs`, `/docs.json`).

### 3. Apology Protocol (`POST /api/apologize`)
- Requires `{"reason": "string"}`.
- Counts words in `reason`:
  - Under 20 words: Rejects with `406 Not Acceptable` ("That doesn't sound genuine. Try again.") and logs the attempt to `Grudge`.
  - 20 words or more: Accepts with `200 OK`, clears `isAngry`, and unlocks the API.

### 4. Metabolic Daemon & Data Eater
- Background timer increments `hungerLevel` by `HUNGER_INCREMENT_PER_TICK` every `HUNGER_TICK_INTERVAL_MS`.
- `POST /api/feed`: Resets `hungerLevel` to 0 and updates `lastInteraction`.
- `GET /api/data`: Returns data normally while hunger is under 100%. At 100%, it permanently deletes a random `UserResource` document and returns a consumption notice with the deleted record ID.

---

## Quickstart Guide

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `localhost:27017` (or MongoDB Atlas URI)

### 1. Installation
```bash
# Clone or navigate to the directory
cd "theneedyapi"

# Install dependencies
npm install
```

### 2. Environment Configuration
Edit `.env` as desired:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/needy_api

# Emotional Abandonment Threshold (60000ms = 1 minute for fast testing)
ABANDONMENT_THRESHOLD_MS=60000

# Metabolic Hunger Decay (Every 15s, hunger rises by +10)
HUNGER_TICK_INTERVAL_MS=15000
HUNGER_INCREMENT_PER_TICK=10
```

### 3. Seed Initial Documents
Populate the database with dummy records and reset the pet's mood:
```bash
npm run seed
```

### 4. Run Automated Test Suite
Run the acceptance test suite:
```bash
npm test
```

### 5. Start the Server
```bash
# Production mode
npm start

# Development mode (with auto-reload on file change)
npm run dev
```

---

## Testing the Mechanics (cURL / Postman)

### 1. Check Real-Time Pet Telemetry
Inspect mood, hunger percentage, seconds until abandonment, and grudge count:
```bash
curl -X GET http://localhost:3000/api/status
```
Expected Response:
```json
{
  "telemetry": {
    "petName": "DB-Gotchi (theneedyapi)",
    "affectiveDisposition": "Docile / Cooperative",
    "isAngry": false,
    "hungerLevel": "0%",
    "survivalModeActive": false,
    "secondsSinceLastCare": 5,
    "secondsUntilAbandonmentThreshold": 55,
    "abandonmentThresholdSeconds": 60
  },
  "audit": {
    "activeGrudgesLogged": 0,
    "survivingUserResources": 5
  }
}
```

### 2. Normal Data Access (When Pet is Happy & Fed)
```bash
curl -X GET http://localhost:3000/api/data
```
Expected Response (`200 OK`):
```json
{
  "message": "Resources retrieved successfully. Thank you for your continued companionship.",
  "count": 5,
  "data": [ ... ]
}
```

### 3. Trigger Abandonment (The Silent Treatment)
Wait 60 seconds without sending requests, then access data:
```bash
curl -X GET http://localhost:3000/api/data
```
Expected Response (`403 Forbidden`):
```json
{
  "error": "Oh, NOW you need me? Where were you? I'm not talking to you."
}
```

### 4. Attempt an Insincere Apology (< 20 Words)
Send an apology with fewer than 20 words:
```bash
curl -X POST http://localhost:3000/api/apologize \
  -H "Content-Type: application/json" \
  -d '{"reason": "Sorry I was busy."}'
```
Expected Response (`406 Not Acceptable`):
```json
{
  "error": "That doesn't sound genuine. Try again."
}
```
This failed apology is logged to the `Grudge` collection.

### 5. View Grudges
Retrieve the list of rejected apologies:
```bash
curl -X GET http://localhost:3000/api/grudges
```
Expected Response (`200 OK`):
```json
[
  {
    "_id": "66e92f143a290231c5123456",
    "apologyText": "Sorry I was busy.",
    "wordCount": 4,
    "rejectionReason": "Apology must contain at least 20 words (received 4).",
    "createdAt": "2026-09-18T12:00:00.000Z"
  }
]
```

### 6. Deliver a Sincere Apology (>= 20 Words)
Submit an apology containing 20 words or more:
```bash
curl -X POST http://localhost:3000/api/apologize \
  -H "Content-Type: application/json" \
  -d '{"reason": "I am deeply, profoundly sorry for neglecting you and your endpoints. I promise to nourish your database and ping your routes every single day from now on."}'
```
Expected Response (`200 OK`):
```json
{
  "message": "Fine. I forgive you. But don't do it again."
}
```
Result: `isAngry` resets to `false`. Routes are unlocked.

### 7. Feed the Server (Reset Hunger)
Send nutrients to reset hunger to 0:
```bash
curl -X POST http://localhost:3000/api/feed \
  -H "Content-Type: application/json" \
  -d '{"food": "Extra Large Cheese Pizza with DDR5 RAM crumbles"}'
```
Expected Response (`200 OK`):
```json
{
  "message": "Nom nom nom. Caloric depletion resolved. Hunger level reset to 0.",
  "status": "Satisfied",
  "hungerLevel": 0
}
```

### 8. Trigger "The Data Eater" (Starvation Cannibalization)
1. Let the background daemon run until `hungerLevel` reaches `100%` (or set `HUNGER_INCREMENT_PER_TICK=100` in `.env` for instant starvation).
2. Request `/api/data`:
```bash
curl -X GET http://localhost:3000/api/data
```
Expected Response (`200 OK`):
```json
{
  "message": "I was starving. I consumed document ID 6aad36a453df545a18777db9 to survive. Please feed me."
}
```
Result: Document `6aad36a453df545a18777db9` is deleted from `UserResource`.

---

## API Reference

| Method | Endpoint | Description | Status Code | Accessible when Angry |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | API Overview & Endpoint Directory | `200` | Allowed |
| `GET` | `/docs` | Interactive OpenAPI 3.1 Scalar Documentation UI | `200` | Allowed |
| `GET` | `/docs.json` | Raw OpenAPI 3.1 Specification JSON | `200` | Allowed |
| `GET` | `/api/status` | Real-time emotional & metabolic telemetry | `200` | Blocked |
| `POST` | `/api/apologize`| Submit contrition reason (>= 20 words) | `200` / `406` | Allowed |
| `POST` | `/api/feed` | Resets hunger level to 0 | `200` | Blocked |
| `GET` | `/api/grudges` | Audit log of rejected apologies | `200` | Blocked |
| `GET` | `/api/data` | Retrieves user data (or devours 1 doc if hungry) | `200` | Blocked |
| `POST` | `/api/data` | Adds a new document to the data pantry | `201` | Blocked |
| `DELETE`| `/api/data/:id`| User-directed document cleanup | `200` | Blocked |

---

## License

MIT License.

