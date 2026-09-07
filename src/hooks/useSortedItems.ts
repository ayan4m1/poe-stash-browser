import { useEffect, useRef, useState } from 'react';

import { Item, SortKey } from '../types';
import {
  applyOrder,
  buildSortRows,
  sortItems,
  SortRequest,
  SortResponse
} from '../utils/sorting';

interface SortResult {
  source: Item[];
  sortKey: SortKey;
  items: Item[];
}

const createWorker = () => {
  try {
    // Forge bundles src/workers/sort.ts to renderer/sort_worker/index.js, a
    // sibling of the main_window directory this document is served from.
    return new Worker(new URL('../sort_worker/index.js', window.location.href));
  } catch (error) {
    console.error('Unable to start the sort worker', error);

    return null;
  }
};

/**
 * Sorts items in a web worker, falling back to the main thread if the worker is
 * unavailable. Until the worker answers, the previous order is returned.
 */
export default function useSortedItems(items: Item[] | null, sortKey: SortKey) {
  const [result, setResult] = useState<SortResult | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const failedRef = useRef(false);

  const needsSort = items !== null && sortKey !== 'none' && items.length > 1;
  const settled =
    !needsSort || (result?.source === items && result?.sortKey === sortKey);
  const sortedItems = !needsSort
    ? items
    : result?.source === items
      ? result.items
      : items;

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    []
  );

  useEffect(() => {
    if (items === null || sortKey === 'none' || items.length < 2 || settled) {
      return;
    }

    const finish = (sorted: Item[]) =>
      setResult({ source: items, sortKey, items: sorted });

    if (!workerRef.current && !failedRef.current) {
      workerRef.current = createWorker();
      failedRef.current = !workerRef.current;
    }

    const worker = workerRef.current;

    if (!worker) {
      const fallbackTimeout = setTimeout(
        () => finish(sortItems(items, sortKey)),
        0
      );

      return () => clearTimeout(fallbackTimeout);
    }

    const id = ++requestIdRef.current;
    const handleMessage = ({ data }: MessageEvent<SortResponse>) => {
      if (data.id !== id) {
        return;
      }

      finish(applyOrder(items, data.order));
    };
    const handleError = (event: ErrorEvent) => {
      console.error('Sort worker failed, sorting on the main thread', event);
      failedRef.current = true;
      worker.terminate();
      workerRef.current = null;
      finish(sortItems(items, sortKey));
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    worker.postMessage({
      id,
      rows: buildSortRows(items),
      sortKey
    } satisfies SortRequest);

    return () => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
    };
  }, [items, sortKey, settled]);

  return sortedItems;
}
