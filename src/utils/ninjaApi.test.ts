import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

import {
  Item,
  ItemFrameType,
  ItemRarity,
  NinjaCurrencyType,
  NinjaExchangeType,
  NinjaItemType,
  NinjaSource
} from '../types';
import {
  NinjaRateLimitError,
  configureNinjaLimiter,
  NinjaRequestError,
  baseNinjaUrl,
  buildNinjaUrl,
  fetchDivineRate,
  fetchNinjaLeagues,
  fetchNinjaOverview,
  getItemValue,
  getNinjaLimiter,
  ninjaRetryDelay
} from './ninjaApi';
import { buildNinjaIndex } from './ninjaValue';
import { makeItem } from './testItems';

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

const errorResponse = (status: number, headers: Record<string, string> = {}) =>
  new Response('{}', { status, headers });

const stubFetch = (response: Response) =>
  mock.method(globalThis, 'fetch', async () => response);

/**
 * A Response body reads once, so anything issuing more than one request - which
 * getItemValue does - needs a fresh Response per call rather than the single
 * instance stubFetch hands back every time.
 */
const routeFetch = (routes: Record<string, unknown>) =>
  mock.method(globalThis, 'fetch', async (input: RequestInfo | URL) => {
    const url = String(input);
    const match = Object.keys(routes).find((fragment) =>
      url.includes(fragment)
    );

    return match
      ? jsonResponse(routes[match])
      : new Response('{}', { status: 404 });
  });

const currency = (baseType: string, stackSize?: number): Item =>
  makeItem({
    baseType,
    typeLine: baseType,
    stackSize,
    frameTypeId: ItemFrameType.Currency
  });

// Where the two halves of getItemValue go. Both carry type=Currency, so the
// endpoint segment is what tells them apart.
const overviewRoute = 'economy/stash/current/currency/overview';
const exchangeRoute = 'economy/exchange/current/overview';

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

  // A value other than the ten second default, so this proves the header is
  // read rather than passing on the fallback.
  it('throws a rate limit error carrying Retry-After', async (t) => {
    stubFetch(errorResponse(429, { 'Retry-After': '3' }));
    t.after(() => mock.restoreAll());

    await assert.rejects(
      fetchNinjaOverview(source, 'Allflame'),
      (error: Error) => {
        assert.ok(error instanceof NinjaRateLimitError);
        assert.equal(error.retryAfterSeconds, 3);

        return true;
      }
    );
  });

  it('falls back to ten seconds when Retry-After is absent', async (t) => {
    stubFetch(errorResponse(429));
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

  // Number('soon') is NaN, which is falsy, so it takes the same fallback.
  it('falls back to ten seconds for an unparseable Retry-After', async (t) => {
    stubFetch(errorResponse(429, { 'Retry-After': 'soon' }));
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

  // The park has to land on the limiter the job ran on, which is the one
  // getNinjaLimiter hands back - otherwise a 429 throttles nothing.
  it('parks the current limiter after a rate limit', async (t) => {
    stubFetch(errorResponse(429, { 'Retry-After': '3' }));
    t.after(() => mock.restoreAll());

    await assert.rejects(fetchNinjaOverview(source, 'Allflame'));

    assert.equal(await getNinjaLimiter().currentReservoir(), 0);
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

describe('fetchNinjaLeagues', () => {
  it('returns the league list and asks for the leagues route', async (t) => {
    const leagues = [
      { url: 'allflame', name: 'Allflame', displayName: 'Allflame' }
    ];
    const fetched = stubFetch(jsonResponse(leagues));
    t.after(() => mock.restoreAll());

    assert.deepEqual(await fetchNinjaLeagues(), leagues);
    assert.equal(
      fetched.mock.calls[0].arguments[0],
      `${baseNinjaUrl}economy/leagues`
    );
  });

  // The proxy answers unknown routes with 200 and an error object, the same way
  // it does for an overview.
  it('throws when the payload is not an array', async (t) => {
    stubFetch(jsonResponse({ error: 'Not found' }));
    t.after(() => mock.restoreAll());

    await assert.rejects(fetchNinjaLeagues(), /Unexpected league payload/);
  });

  it('propagates a request failure', async (t) => {
    stubFetch(errorResponse(500));
    t.after(() => mock.restoreAll());

    await assert.rejects(fetchNinjaLeagues(), (error: Error) => {
      assert.ok(error instanceof NinjaRequestError);
      assert.equal(error.status, 500);

      return true;
    });
  });
});

describe('fetchDivineRate', () => {
  it('reads the rate off the exchange overview', async (t) => {
    const fetched = stubFetch(
      jsonResponse({ core: { primary: 'chaos', rates: { divine: 0.002977 } } })
    );
    t.after(() => mock.restoreAll());

    assert.equal(await fetchDivineRate('Allflame'), 0.002977);

    // The hard-coded exchange source is the only place this endpoint and type
    // pair is chosen - resolveNinjaSource never yields NinjaExchangeType.Currency.
    assert.equal(
      fetched.mock.calls[0].arguments[0],
      `${baseNinjaUrl}${exchangeRoute}?league=Allflame&type=Currency`
    );
  });

  it('returns undefined when the overview publishes no rate', async (t) => {
    stubFetch(jsonResponse({ core: { primary: 'chaos' } }));
    t.after(() => mock.restoreAll());

    assert.equal(await fetchDivineRate('Allflame'), undefined);
  });

  it('propagates a request failure', async (t) => {
    stubFetch(errorResponse(503));
    t.after(() => mock.restoreAll());

    await assert.rejects(fetchDivineRate('Allflame'), (error: Error) => {
      assert.ok(error instanceof NinjaRequestError);
      assert.equal(error.status, 503);

      return true;
    });
  });
});

describe('getItemValue', () => {
  const source: NinjaSource = {
    endpoint: 'currency',
    type: NinjaCurrencyType.Currency
  };

  const chaosOverview = {
    lines: [
      { currencyTypeName: 'Chaos Orb', chaosEquivalent: 1 },
      { currencyTypeName: 'Divine Orb', chaosEquivalent: 336 }
    ],
    currencyDetails: []
  };

  const index = () => buildNinjaIndex(source, 'Allflame', chaosOverview);

  it('returns undefined for an item poe.ninja does not price', async (t) => {
    const fetched = stubFetch(jsonResponse(chaosOverview));
    t.after(() => mock.restoreAll());

    const rare = makeItem({
      rarity: ItemRarity.Rare,
      frameTypeId: ItemFrameType.Rare,
      baseType: 'Vaal Regalia',
      properties: [{ name: 'Body Armour', values: [] }]
    });

    assert.equal(await getItemValue(rare, 'Allflame'), undefined);
    assert.equal(fetched.mock.callCount(), 0);
  });

  // The league guard has to come first, or every render before a league is
  // picked would spend two requests to learn nothing.
  it('returns undefined without a league, before fetching anything', async (t) => {
    const fetched = stubFetch(jsonResponse(chaosOverview));
    t.after(() => mock.restoreAll());

    assert.equal(await getItemValue(currency('Chaos Orb'), ''), undefined);
    assert.equal(fetched.mock.callCount(), 0);
  });

  it('prices an item from an injected overview fetcher', async (t) => {
    routeFetch({
      [exchangeRoute]: {
        core: { primary: 'chaos', rates: { divine: 0.002977 } }
      }
    });
    t.after(() => mock.restoreAll());

    const fetchOverview = mock.fn(async () => index());
    const value = await getItemValue(
      currency('Divine Orb'),
      'Allflame',
      fetchOverview
    );

    assert.equal(fetchOverview.mock.callCount(), 1);
    assert.deepEqual(fetchOverview.mock.calls[0].arguments, [
      source,
      'Allflame'
    ]);
    // 336 chaos at 0.002977 divine per chaos is a hair over one divine, which
    // is the rate saying a Divine Orb is worth itself.
    assert.deepEqual(value, {
      value: 1.000272,
      currency: 'divine',
      chaosValue: 336,
      unitChaosValue: 336,
      stackSize: 1
    });
  });

  // Without a fetcher it goes to the network for both halves, which is the
  // default parameter the hooks rely on.
  it('fetches the overview itself when no fetcher is given', async (t) => {
    const fetched = routeFetch({
      [overviewRoute]: chaosOverview,
      [exchangeRoute]: { core: { primary: 'chaos' } }
    });
    t.after(() => mock.restoreAll());

    const value = await getItemValue(currency('Chaos Orb'), 'Allflame');

    assert.equal(fetched.mock.callCount(), 2);
    assert.equal(value?.chaosValue, 1);
    assert.equal(value?.currency, 'chaos');
  });

  // A stack worth a whole divine or more flips the denomination.
  it('reports a large stack in divines', async (t) => {
    routeFetch({
      [exchangeRoute]: {
        core: { primary: 'chaos', rates: { divine: 0.002977 } }
      }
    });
    t.after(() => mock.restoreAll());

    const value = await getItemValue(
      currency('Chaos Orb', 500),
      'Allflame',
      async () => index()
    );

    assert.equal(value?.currency, 'divine');
    assert.equal(value?.chaosValue, 500);
    assert.equal(value?.stackSize, 500);
  });

  it('returns undefined when no line in the overview matches', async (t) => {
    routeFetch({
      [exchangeRoute]: { core: { primary: 'chaos' } }
    });
    t.after(() => mock.restoreAll());

    const value = await getItemValue(
      currency('Mirror of Kalandra'),
      'Allflame',
      async () => index()
    );

    assert.equal(value, undefined);
  });
});

describe('getNinjaLimiter', () => {
  it('returns the limiter configureNinjaLimiter installed', () => {
    const limiter = configureNinjaLimiter(5);

    // Reference identity - two Bottlenecks built with the same settings would
    // satisfy a deep comparison and prove nothing.
    assert.equal(getNinjaLimiter(), limiter);
  });

  it('hands back the replacement after a reconfiguration', () => {
    const first = getNinjaLimiter();

    configureNinjaLimiter(7);

    assert.notEqual(getNinjaLimiter(), first);
  });

  it('returns the same instance between reconfigurations', () => {
    assert.equal(getNinjaLimiter(), getNinjaLimiter());
  });
});

describe('ninja limiter', () => {
  const source = {
    endpoint: 'currency' as const,
    type: NinjaCurrencyType.Currency
  };
  const floor = 200;
  const requestTime = 250;

  // The regression: Bottleneck's minTime counts from when a job was launched, so
  // a request slower than the floor used to leave no gap at all behind it - which
  // is how a cold /economy/leagues let the very next request go out instantly.
  it('spaces requests from when the last one finished, not when it started', async (t) => {
    configureNinjaLimiter(floor);

    const starts: number[] = [];

    mock.method(globalThis, 'fetch', async () => {
      starts.push(Date.now());

      await new Promise((resolve) => setTimeout(resolve, requestTime));

      return jsonResponse({ lines: [], currencyDetails: [] });
    });
    t.after(() => mock.restoreAll());

    await Promise.all([
      fetchNinjaOverview(source, 'Allflame'),
      fetchNinjaOverview(source, 'Allflame')
    ]);

    assert.equal(starts.length, 2);
    assert.ok(
      starts[1] - starts[0] >= requestTime + floor - 20,
      `expected at least ${requestTime + floor}ms between requests, got ${starts[1] - starts[0]}ms`
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
