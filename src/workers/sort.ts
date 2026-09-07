import { SortRequest, SortResponse, sortRows } from '../utils/sorting';

/**
 * Only the slice of DedicatedWorkerGlobalScope this worker uses. Pulling in the
 * "webworker" lib alongside "dom" would collide on globals like self.
 */
type SortWorkerScope = {
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<SortRequest>) => void
  ): void;
  postMessage(message: SortResponse, transfer?: Transferable[]): void;
};

const ctx = self as unknown as SortWorkerScope;

ctx.addEventListener('message', ({ data: { id, rows, sortKey } }) => {
  const order = sortRows(rows, sortKey);

  ctx.postMessage({ id, order }, [order.buffer as ArrayBuffer]);
});
