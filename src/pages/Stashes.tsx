import { Fragment, useCallback, useMemo, useState } from 'react';

import FilterForm from '../components/FilterForm';
import Layout from '../components/Layout';
import useStashes from '../hooks/useStashes';
import useAppContext from '../hooks/useAppContext';
import useStashItems from '../hooks/useStashItems';
import {
  FilterForm as FilterFormType,
  Item as ItemType,
  SortKey
} from '../types';
import { itemMatchesFilter, sortItems } from '../utils';
import QueryProgress from '../components/QueryProgress';
import SearchResults from '../components/SearchResults';

export default function Stashes() {
  const [filteredItems, setFilteredItems] = useState<ItemType[] | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('none');
  const { selectedLeague } = useAppContext();
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
  const handleRefetchClick = useCallback(() => {
    if (
      confirm('Are you sure you want to discard cached data for this league?')
    ) {
      queries.forEach((query) => query.refetch());
    }
  }, [queries]);
  const handleFilter = useCallback(
    (values: FilterFormType) => {
      if (!doneFetching) {
        return;
      }

      const items: ItemType[] = [];

      for (const query of queries) {
        if (!query?.data?.stash?.items?.length) {
          continue;
        }

        for (const item of query.data.stash.items) {
          if (itemMatchesFilter(item, values)) {
            items.push(item);
          }
        }
      }

      setFilteredItems(items);
    },
    [doneFetching, queries]
  );
  const sortedItems = useMemo(
    () => sortItems(filteredItems, sortKey),
    [filteredItems, sortKey]
  );

  return (
    <Layout>
      {!selectedLeague ? (
        <h1>Select a league first</h1>
      ) : doneFetching ? (
        <Fragment>
          <FilterForm
            onFilter={handleFilter}
            onRefetchClick={handleRefetchClick}
          />
          <SearchResults
            items={sortedItems}
            onSortChange={setSortKey}
            sortKey={sortKey}
          />
        </Fragment>
      ) : (
        <QueryProgress queries={queries} timeEstimate={timeEstimate} />
      )}
    </Layout>
  );
}
