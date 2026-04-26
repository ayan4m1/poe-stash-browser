import { Fragment, useCallback, useMemo, useState } from 'react';
import { Button, Col, Row, Spinner, ProgressBar } from 'react-bootstrap';
import {
  faGridVertical,
  faListDots,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import FilterForm from '../components/FilterForm';
import Item from '../components/Item';
import Layout from '../components/Layout';
import useStashes from '../hooks/useStashes';
import useAppContext from '../hooks/useAppContext';
import useStashItems from '../hooks/useStashItems';
import {
  DisplayMode,
  FilterForm as FilterFormType,
  Item as ItemType
} from '../types';
import { itemMatchesFilter } from '../utils';

export default function Stashes() {
  const [displayMode, setDisplayMode] = useState(DisplayMode.Grid);
  const [filteredItems, setFilteredItems] = useState<ItemType[]>([]);
  const { selectedLeague } = useAppContext();
  const { data } = useStashes(selectedLeague?.id);
  const { queries } = useStashItems(selectedLeague?.id, data?.stashes);
  const doneFetching = useMemo(
    () => queries.every((query) => query.isFetched && !query.isRefetching),
    [queries]
  );
  const handleRefetchClick = useCallback(
    () => queries.forEach((query) => query.refetch()),
    [queries]
  );
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
  const fetched = useMemo(
    () =>
      queries.filter((query) => query.isFetched && !query.isRefetching).length,
    [queries]
  );
  const handleGridClick = useCallback(
    () => setDisplayMode(DisplayMode.Grid),
    []
  );
  const handleListClick = useCallback(
    () => setDisplayMode(DisplayMode.List),
    []
  );

  return (
    <Layout>
      <h1>My Stashes</h1>
      {!selectedLeague ? (
        <p>Select a league first</p>
      ) : doneFetching ? (
        <Fragment>
          <Row>
            <Col className="text-end">
              <Button variant="danger" onClick={handleRefetchClick}>
                <FontAwesomeIcon icon={faRefresh} /> Refetch
              </Button>
            </Col>
          </Row>
          <FilterForm onFilter={handleFilter} />
          <Row className="mb-4">
            <Col className="text-end">
              <Button onClick={handleGridClick}>
                <FontAwesomeIcon icon={faGridVertical} />
              </Button>{' '}
              <Button onClick={handleListClick}>
                <FontAwesomeIcon icon={faListDots} />
              </Button>
            </Col>
          </Row>
          <Row>
            {filteredItems.length ? (
              filteredItems.map((item) => <Item key={item.id} item={item} />)
            ) : (
              <Col className="text-center">No results</Col>
            )}
          </Row>
        </Fragment>
      ) : (
        <Fragment>
          <Row>
            <Col xs={12} sm={6}>
              <h4>
                Fetching{' '}
                {
                  queries.filter(
                    (query) => !query.isFetched || query.isRefetching
                  ).length
                }{' '}
                stash tabs&hellip;
              </h4>
            </Col>
            <Col xs={12} sm={6} className="text-end">
              <Spinner className="text-center" />
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <ProgressBar min={1} now={fetched} max={queries.length} />
            </Col>
          </Row>
        </Fragment>
      )}
    </Layout>
  );
}
