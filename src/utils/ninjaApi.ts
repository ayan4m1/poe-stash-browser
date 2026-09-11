import Bottleneck from 'bottleneck';
import { setTimeout as delay } from 'node:timers/promises';

import {
  Item,
  NinjaExchangeType,
  NinjaEndpoint,
  NinjaExchangeOverviewResponse,
  NinjaLeague,
  NinjaOverviewIndex,
  NinjaSource,
  ItemValue
} from '../types';
import { resolveNinjaSource } from './ninja';
import {
  buildNinjaIndex,
  getExchangeDivineRate,
  valueFromIndex
} from './ninjaValue';

export const baseNinjaUrl = 'https://poe-ninja.bulletlogic.com/';

// The proxy mirrors https://poe.ninja/poe1/api/ with that prefix stripped.
const overviewPaths: Record<NinjaEndpoint, string> = {
  item: 'economy/stash/current/item/overview',
  currency: 'economy/stash/current/currency/overview',
  exchange: 'economy/exchange/current/overview'
};

/** Matches the proxy's Cache-Control max-age; the data behind it moves slower. */
export const ninjaStaleTime = 30 * 60 * 1000;
export const ninjaGcTime = 60 * 60 * 1000;

const defaultRetryAfterSeconds = 10;

export class NinjaRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(url: string, retryAfterSeconds: number) {
    super(`Rate limited fetching ${url}`);
    this.name = 'NinjaRateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class NinjaRequestError extends Error {
  readonly status: number;

  constructor(url: string, status: number) {
    super(`Failed to fetch ${url} (${status})`);
    this.name = 'NinjaRequestError';
    this.status = status;
  }
}

/**
 * The proxy serialises callers rather than publishing rate limit headers, so
 * there is nothing to sync from a response the way useRateLimiters does for the
 * GGG API - a fixed floor between requests is the whole budget.
 *
 * minTime here is only a lower bound and never the binding one: Bottleneck
 * measures it launch-to-launch, so it buys nothing once a request outlasts the
 * floor. What actually holds the gap open is the trailing wait in `schedule`.
 */
export const createNinjaLimiter = (minTime: number) =>
  new Bottleneck({ maxConcurrent: 1, minTime });

export const defaultNinjaMinTime = 1e3;

let ninjaLimiter = createNinjaLimiter(defaultNinjaMinTime);
// Bottleneck does not hand its settings back, and the trailing wait needs the
// number, so the floor is tracked alongside the limiter it was built with.
let ninjaMinTime = defaultNinjaMinTime;

/**
 * Replaces the shared limiter, discarding any park left over from a 429. The
 * floor between requests is a guess at the proxy's budget rather than something
 * it advertises, so it needs to be adjustable without editing this file.
 */
export const configureNinjaLimiter = (minTime: number) => {
  ninjaLimiter = createNinjaLimiter(minTime);
  ninjaMinTime = minTime;

  return ninjaLimiter;
};

export const getNinjaLimiter = () => ninjaLimiter;

/** Parks the limiter for the duration the proxy asked for. */
const blockRequests = (limiter: Bottleneck, seconds: number) => {
  limiter.updateSettings({ reservoir: 0 });

  const handle = setTimeout(
    () => limiter.updateSettings({ reservoir: null }),
    seconds * 1e3
  );

  // Under Node this timer would otherwise hold the event loop open for the
  // whole park; in the renderer setTimeout hands back a number and there is
  // nothing to unref.
  (handle as unknown as { unref?: () => void }).unref?.();
};

const request = async (
  limiter: Bottleneck,
  url: string,
  signal?: AbortSignal
) => {
  const response = await fetch(url, { signal });

  if (response.status === 429) {
    const retryAfterSeconds =
      Number(response.headers.get('Retry-After')) || defaultRetryAfterSeconds;

    blockRequests(limiter, retryAfterSeconds);

    throw new NinjaRateLimitError(url, retryAfterSeconds);
  }

  if (!response.ok) {
    throw new NinjaRequestError(url, response.status);
  }

  return response.json();
};

/**
 * Runs a job on whichever limiter is current, and hands it that limiter so a
 * 429 parks the same instance the job was queued on.
 *
 * The slot is held for the floor after the job settles rather than left to
 * Bottleneck's minTime, which counts from when a job was launched: with
 * maxConcurrent 1 the next request goes out at max(launch + minTime, done), so
 * a request slower than the floor leaves no gap at all behind it. The first
 * press of a price button hit exactly that - a cold /economy/leagues took over
 * a second, and the overview its answer unblocked went out instantly and 429'd.
 */
const schedule = <T>(job: (limiter: Bottleneck) => Promise<T>): Promise<T> => {
  const limiter = ninjaLimiter;
  const floor = ninjaMinTime;

  return limiter.schedule(async () => {
    try {
      return await job(limiter);
    } finally {
      // Also on failure and on abort - the proxy may well have counted those.
      await delay(floor);
    }
  });
};

export const buildNinjaUrl = (source: NinjaSource, league: string) =>
  `${baseNinjaUrl}${overviewPaths[source.endpoint]}` +
  `?league=${encodeURIComponent(league)}&type=${encodeURIComponent(source.type)}`;

export const fetchNinjaLeagues = (
  signal?: AbortSignal
): Promise<NinjaLeague[]> =>
  schedule(async (limiter) => {
    const url = `${baseNinjaUrl}economy/leagues`;
    const payload = await request(limiter, url, signal);

    if (!Array.isArray(payload)) {
      throw new Error(`Unexpected league payload from ${url}`);
    }

    return payload as NinjaLeague[];
  });

/**
 * Fetches an overview and hands back only its projection. The raw payload -
 * up to seven thousand lines for skill gems - is discarded here so it never
 * reaches a caller or the query cache.
 */
export const fetchNinjaOverview = (
  source: NinjaSource,
  league: string,
  signal?: AbortSignal
): Promise<NinjaOverviewIndex> =>
  schedule(async (limiter) => {
    const url = buildNinjaUrl(source, league);
    const payload = await request(limiter, url, signal);

    if (!Array.isArray(payload?.lines)) {
      throw new Error(`Unexpected overview payload from ${url}`);
    }

    return buildNinjaIndex(source, league, payload);
  });

/**
 * Divine orbs per chaos orb. Taken from the currency exchange overview because
 * it publishes the rate outright, and using one rate everywhere keeps totals
 * from disagreeing with the items they are summed from.
 */
export const fetchDivineRate = (
  league: string,
  signal?: AbortSignal
): Promise<number | undefined> =>
  schedule(async (limiter) => {
    const source: NinjaSource = {
      endpoint: 'exchange',
      type: NinjaExchangeType.Currency
    };
    const url = buildNinjaUrl(source, league);
    const payload = (await request(
      limiter,
      url,
      signal
    )) as NinjaExchangeOverviewResponse;

    return getExchangeDivineRate(payload);
  });

/** Backs off for as long as the proxy asked, and exponentially otherwise. */
export const ninjaRetryDelay = (attempt: number, error: Error) =>
  error instanceof NinjaRateLimitError
    ? error.retryAfterSeconds * 1e3
    : Math.min(30e3, 1e3 * 2 ** attempt);

export type NinjaOverviewFetcher = (
  source: NinjaSource,
  league: string
) => Promise<NinjaOverviewIndex>;

/**
 * Estimated value of a single item, or undefined when poe.ninja has no category
 * for it and when no line in that category matches.
 *
 * This is the one-item entry point and costs two requests, so it is for one-off
 * and non-React use. Anything pricing a list should go through useItemValue,
 * which fetches one overview per category and shares it across items - pass its
 * cache-backed fetcher as `fetchOverview` to reuse the same code path.
 */
export const getItemValue = async (
  item: Item,
  league: string,
  fetchOverview: NinjaOverviewFetcher = fetchNinjaOverview
): Promise<ItemValue | undefined> => {
  const source = resolveNinjaSource(item);

  if (!source || !league) {
    return undefined;
  }

  const [index, divineRate] = await Promise.all([
    fetchOverview(source, league),
    fetchDivineRate(league)
  ]);

  return valueFromIndex(item, index, divineRate);
};
