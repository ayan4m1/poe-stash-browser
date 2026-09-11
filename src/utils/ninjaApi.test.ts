import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

import { NinjaCurrencyType, NinjaExchangeType, NinjaItemType } from '../types';
import {
  NinjaRateLimitError,
  configureNinjaLimiter,
  NinjaRequestError,
  buildNinjaUrl,
  fetchNinjaOverview,
  ninjaRetryDelay
} from './ninjaApi';

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

const errorResponse = (status: number, headers: Record<string, string> = {}) =>
  new Response('{}', { status, headers });

const stubFetch = (response: Response) =>
  mock.method(globalThis, 'fetch', async () => response);

// A fresh limiter per test, so the ten second park a 429 leaves behind does not
// stall the tests that follow it.
beforeEach(() => configureNinjaLimiter(1));

describe('buildNinjaUrl', () => {
  it('builds an item overview url', () => {
    assert.equal(
      buildNinjaUrl(
        { endpoint: 'item', type: NinjaItemType.UniqueWeapon },
        'Allflame'
      ),
      'https://poe-ninja.bulletlogic.com/economy/stash/current/item/overview' +
        '?league=Allflame&type=UniqueWeapon'
    );
  });

  it('builds a currency overview url', () => {
    assert.equal(
      buildNinjaUrl(
        { endpoint: 'currency', type: NinjaCurrencyType.Fragment },
        'Allflame'
      ),
      'https://poe-ninja.bulletlogic.com/economy/stash/current/currency/overview' +
        '?league=Allflame&type=Fragment'
    );
  });

  // League ids carry spaces, and the proxy 404s on an unencoded one.
  it('encodes a league containing a space', () => {
    assert.equal(
      buildNinjaUrl(
        { endpoint: 'exchange', type: NinjaExchangeType.Scarab },
        'Hardcore Allflame'
      ),
      'https://poe-ninja.bulletlogic.com/economy/exchange/current/overview' +
        '?league=Hardcore%20Allflame&type=Scarab'
    );
  });
});

describe('fetchNinjaOverview', () => {
  const source = {
    endpoint: 'currency' as const,
    type: NinjaCurrencyType.Currency
  };

  it('returns a projected index rather than the raw payload', async (t) => {
    stubFetch(
      jsonResponse({
        lines: [{ currencyTypeName: 'Chaos Orb', chaosEquivalent: 1 }],
        currencyDetails: [{ id: 1, name: 'Chaos Orb', tradeId: 'chaos' }]
      })
    );
    t.after(() => mock.restoreAll());

    const index = await fetchNinjaOverview(source, 'Allflame');

    assert.equal(index.league, 'Allflame');
    assert.equal(index.endpoint, 'currency');
    assert.deepEqual(index.entries, { 'Chaos Orb': { chaosValue: 1 } });
  });

  it('throws a rate limit error carrying Retry-After', async (t) => {
    stubFetch(errorResponse(429, { 'Retry-After': '10' }));
    t.after(() => mock.restoreAll());

    await assert.rejects(
      fetchNinjaOverview(source, 'Allflame'),
      (error: Error) => {
        assert.ok(error instanceof NinjaRateLimitError);
        assert.equal(error.retryAfterSeconds, 10);

        return true;
      }
    );
  });

  it('throws a request error for any other failure', async (t) => {
    stubFetch(errorResponse(404));
    t.after(() => mock.restoreAll());

    await assert.rejects(
      fetchNinjaOverview(source, 'Allflame'),
      (error: Error) => {
        assert.ok(error instanceof NinjaRequestError);
        assert.equal(error.status, 404);

        return true;
      }
    );
  });

  // The proxy answers unknown routes with 200 and an error object.
  it('throws when the payload has no lines', async (t) => {
    stubFetch(jsonResponse({ error: 'Not found' }));
    t.after(() => mock.restoreAll());

    await assert.rejects(
      fetchNinjaOverview(source, 'Allflame'),
      /Unexpected overview/
    );
  });
});

describe('ninjaRetryDelay', () => {
  it('honours the delay the proxy asked for', () => {
    assert.equal(ninjaRetryDelay(0, new NinjaRateLimitError('url', 10)), 10000);
  });

  it('backs off exponentially otherwise', () => {
    assert.equal(ninjaRetryDelay(0, new NinjaRequestError('url', 500)), 1000);
    assert.equal(ninjaRetryDelay(2, new NinjaRequestError('url', 500)), 4000);
  });

  it('caps the backoff', () => {
    assert.equal(ninjaRetryDelay(20, new NinjaRequestError('url', 500)), 30000);
  });
});
