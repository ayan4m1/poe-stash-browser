import { useMemo, useState } from 'react';

import Layout from '../components/Layout';
import useStashItems from '../hooks/useStashItems';
import useAppContext from '../hooks/useAppContext';
import useStashes from '../hooks/useStashes';
import useSortedItems from '../hooks/useSortedItems';
import QueryProgress from '../components/QueryProgress';
import SearchResults from '../components/SearchResults';
import { Item, SortKey } from '../types';

export default function Items() {
  const [sortKey, setSortKey] = useState<SortKey>('none');
  const { selectedLeague, savedItems: rawSavedItems } = useAppContext();
  const { data } = useStashes(selectedLeague?.id);
  const { queries, timeEstimate } = useStashItems(
    selectedLeague?.id,
    data?.stashes
  );
  const doneFetching = useMemo(
    () =>
      queries.every((query) => query.isFetched && !query.isRefetching) &&
      queries.length,
    [queries]
  );
  const savedItems: Item[] = useMemo(() => {
    const result: Item[] = [];

    if (!rawSavedItems) {
      return result;
    }

    for (const saveItemId of rawSavedItems) {
      const saveItem = queries.flatMap((query) => {
        const matchingItem = query.data?.stash?.items?.find(
          (item) => item.id === saveItemId
        );

        if (matchingItem) {
          return [matchingItem];
        } else {
          return [];
        }
      });

      if (saveItem.length) {
        result.push(saveItem[0]);
      }
    }

    return result;
  }, [rawSavedItems, queries]);
  const sortedItems = useSortedItems(savedItems, sortKey);

  return (
    <Layout>
      {!selectedLeague ? (
        <h1>Select a league first</h1>
      ) : doneFetching ? (
        <SearchResults
          items={sortedItems}
          onSortChange={setSortKey}
          sortKey={sortKey}
        />
      ) : (
        <QueryProgress queries={queries} timeEstimate={timeEstimate} />
      )}
    </Layout>
  );
}
