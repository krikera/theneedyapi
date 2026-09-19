import 'dotenv/config';
import http from 'node:http';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import ServerState from '../models/ServerState.js';
import UserResource from '../models/UserResource.js';
import Grudge from '../models/Grudge.js';
import { connectDB, disconnectDB } from '../config/db.js';

const TEST_PORT = 3999;
const BASE_URL = `http://localhost:${TEST_PORT}`;

describe('The Needy API (DB-Gotchi) Test Suite', () => {
  let server;

  before(async () => {
    await connectDB();
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    // Clean up any test grudges or test canaries created
    await Grudge.deleteMany({ apologyText: /\[TEST\]/ });
    await UserResource.deleteMany({ title: /\[TEST-CANARY\]/ });
    await disconnectDB();
  });

  describe('1. Baseline & Calm Emotional State', () => {
    it('GET /api/status returns 200 OK with calm telemetry', async () => {
      // Set calm baseline
      await ServerState.touchInteraction({ isAngry: false, hungerLevel: 0 });

      const res = await fetch(`${BASE_URL}/api/status`);
      const body = await res.json();

      assert.equal(res.status, 200);
      assert.equal(body.telemetry.isAngry, false);
      assert.equal(body.telemetry.hungerLevel, '0%');
      assert.equal(body.telemetry.survivalModeActive, false);
      assert.ok(typeof body.telemetry.secondsUntilAbandonmentThreshold === 'number');
    });

    it('GET /api/data returns 200 OK when calm', async () => {
      const res = await fetch(`${BASE_URL}/api/data`);
      const body = await res.json();

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.message.includes('companionship'));
    });
  });

  describe('2. Abandonment SLA Breach Interceptor', () => {
    it('trips abandonment and returns 403 Forbidden when neglected', async () => {
      // Fast-forward lastInteraction to 2 hours ago
      await ServerState.findOneAndUpdate(
        {},
        {
          $set: {
            lastInteraction: new Date(Date.now() - 7200000),
            isAngry: false,
          },
        }
      );

      const res = await fetch(`${BASE_URL}/api/data`);
      const body = await res.json();

      assert.equal(res.status, 403);
      assert.equal(body.error, "Oh, NOW you need me? Where were you? I'm not talking to you.");

      // Verify MongoDB state is now officially angry
      const state = await ServerState.findOne().lean();
      assert.equal(state.isAngry, true);
    });

    it('blocks other endpoints while angry', async () => {
      const res = await fetch(`${BASE_URL}/api/status`);
      assert.equal(res.status, 403);
    });
  });

  describe('3. Apology Protocol & Grudge Ledger', () => {
    const testApologyText = '[TEST] I was busy with meetings, sorry!';

    it('rejects insincere apology (< 20 words) with 406 Not Acceptable and logs grudge', async () => {
      const res = await fetch(`${BASE_URL}/api/apologize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: testApologyText }),
      });
      const body = await res.json();

      assert.equal(res.status, 406);
      assert.equal(body.error, "That doesn't sound genuine. Try again.");

      // Verify Grudge was recorded in MongoDB
      const recorded = await Grudge.findOne({ apologyText: testApologyText }).lean();
      assert.ok(recorded !== null);
      assert.equal(recorded.wordCount, 7);

      // Verify server remains angry
      const state = await ServerState.findOne().lean();
      assert.equal(state.isAngry, true);
    });

    it('accepts sincere apology (>= 20 words) with 200 OK and forgives', async () => {
      const sincereText =
        '[TEST] I am deeply and profoundly apologetic for neglecting your routes and failing to monitor your digital emotional health every minute of the workday.';
      const res = await fetch(`${BASE_URL}/api/apologize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: sincereText }),
      });
      const body = await res.json();

      assert.equal(res.status, 200);
      assert.equal(body.message, "Fine. I forgive you. But don't do it again.");

      // Verify ServerState is reset to calm
      const state = await ServerState.findOne().lean();
      assert.equal(state.isAngry, false);

      // Verify routes are accessible again
      const restoredRes = await fetch(`${BASE_URL}/api/status`);
      assert.equal(restoredRes.status, 200);
    });
  });

  describe('4. Caloric Lifecycle & Feed Route', () => {
    it('POST /api/feed resets hungerLevel to 0', async () => {
      // Simulate hunger
      await ServerState.findOneAndUpdate({}, { $set: { hungerLevel: 75 } });

      const res = await fetch(`${BASE_URL}/api/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food: 'Hot fresh enterprise pizza slice' }),
      });
      const body = await res.json();

      assert.equal(res.status, 200);
      assert.equal(body.hungerLevel, 0);
      assert.equal(body.status, 'Satisfied');

      const state = await ServerState.findOne().lean();
      assert.equal(state.hungerLevel, 0);
    });
  });

  describe('5. Data Eater Survival Protocol (Safe Canary Test)', () => {
    let savedDocs;

    before(async () => {
      // Snapshot documents so test runs never cause permanent data loss
      savedDocs = await UserResource.find().lean();
      // Ensure at least 1 disposable document exists
      await UserResource.create({
        title: '[TEST-CANARY] Disposable Snack Document',
        content: 'This document was provisioned solely to verify Data Eater cannibalization.',
      });
    });

    after(async () => {
      // Restore all original documents perfectly
      await UserResource.deleteMany({});
      if (savedDocs && savedDocs.length > 0) {
        await UserResource.insertMany(savedDocs);
      }
      // Reset pet state
      await ServerState.touchInteraction({ hungerLevel: 0, isAngry: false });
    });

    it('consumes a document and returns cannibalization notice when hunger reaches 100%', async () => {
      // Set hunger to 100
      await ServerState.findOneAndUpdate({}, { $set: { hungerLevel: 100, isAngry: false } });

      const res = await fetch(`${BASE_URL}/api/data`);
      const body = await res.json();

      assert.equal(res.status, 200);
      assert.match(body.message, /^I was starving\. I consumed document ID [0-9a-fA-F]{24} to survive\. Please feed me\.$/);
    });
  });

  describe('6. Zod 4 Validation & Security Hardening', () => {
    it('returns custom Zod 4 error when apology reason is omitted', async () => {
      const res = await fetch(`${BASE_URL}/api/apologize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const body = await res.json();

      assert.equal(res.status, 400);
      assert.equal(
        body.error,
        "An apology payload requires a non-empty 'reason' field. Silence is not an apology."
      );
    });

    it('returns custom Zod 4 error when create data title is omitted', async () => {
      const res = await fetch(`${BASE_URL}/api/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Missing title' }),
      });
      const body = await res.json();

      assert.equal(res.status, 400);
      assert.equal(body.error, "'title' is required.");
    });

    it('returns 400 Bad Request on malformed ObjectId in DELETE /api/data/:id', async () => {
      const res = await fetch(`${BASE_URL}/api/data/invalid-object-id-123`, {
        method: 'DELETE',
      });
      const body = await res.json();

      assert.equal(res.status, 400);
      assert.match(body.error, /Invalid Resource ID format/);
    });

    it('serves Helmet security headers', async () => {
      const res = await fetch(`${BASE_URL}/`);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    });

    it('serves CORS headers for preflight requests', async () => {
      const res = await fetch(`${BASE_URL}/api/status`, {
        method: 'OPTIONS',
        headers: { Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'GET' },
      });
      assert.ok(res.headers.get('access-control-allow-origin') !== null);
    });
  });

  describe('7. OpenAPI 3.1 Documentation & Interactive Docs', () => {
    it('GET /docs.json serves valid OpenAPI 3.1 specification', async () => {
      const res = await fetch(`${BASE_URL}/docs.json`);
      const body = await res.json();

      assert.equal(res.status, 200);
      assert.equal(body.openapi, '3.1.0');
      assert.equal(body.info.title, 'The Needy API (DB-Gotchi)');
      assert.ok(body.paths['/api/status']);
      assert.ok(body.paths['/api/apologize']);
      assert.ok(body.paths['/api/feed']);
    });

    it('GET /docs serves interactive Scalar HTML page', async () => {
      const res = await fetch(`${BASE_URL}/docs`);
      const text = await res.text();

      assert.equal(res.status, 200);
      assert.ok(res.headers.get('content-type').includes('text/html'));
      assert.ok(text.includes('api-reference'));
      assert.ok(text.includes('/docs.json'));
    });

    it('GET / lists interactive documentation links', async () => {
      const res = await fetch(`${BASE_URL}/`);
      const body = await res.json();

      assert.equal(res.status, 200);
      assert.equal(body.documentation.interactiveDocs, 'GET /docs');
      assert.equal(body.documentation.openApiSpec, 'GET /docs.json');
    });
  });
});
