import { Fragment, useCallback, useMemo, useState } from 'react';
import {
  Button,
  Col,
  Row,
  Spinner,
  ProgressBar,
  Form,
  Badge
} from 'react-bootstrap';
import {
  faGridVertical,
  faListDots,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import FilterForm from '../components/FilterForm';
import ListItem from '../components/ListItem';
import GridItem from '../components/GridItem';
import Layout from '../components/Layout';
import useStashes from '../hooks/useStashes';
import useAppContext from '../hooks/useAppContext';
import useStashItems from '../hooks/useStashItems';
import {
  DisplayMode,
  FilterForm as FilterFormType,
  Item as ItemType,
  SortKey
} from '../types';
import { itemMatchesFilter } from '../utils';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { addSeconds } from 'date-fns/addSeconds';

export default function Stashes() {
  const defaultDisplayMode = localStorage.getItem(
    'app.defaultDisplayMode'
  ) as DisplayMode;
  const [displayMode, setDisplayMode] = useState(defaultDisplayMode);
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
  const sortedItems = useMemo(() => {
    if (!filteredItems) {
      return null;
    }
    if (sortKey === 'none') {
      return filteredItems;
    }
    return [...filteredItems].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return (a.name || a.typeLine).localeCompare(b.name || b.typeLine);
        case 'ilvl':
          return b.ilvl - a.ilvl;
        case 'stashTab':
          return (a.stashTab ?? '').localeCompare(b.stashTab ?? '');
        case 'stackSize':
          return (b.stackSize ?? 0) - (a.stackSize ?? 0);
        default:
          return 0;
      }
    });
  }, [filteredItems, sortKey]);
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
      {!selectedLeague ? (
        <p>Select a league first</p>
      ) : doneFetching ? (
        <Fragment>
          <Row>
            <Col className="text-end">
              <Button onClick={handleRefetchClick} variant="danger">
                <FontAwesomeIcon icon={faRefresh} /> Refetch
              </Button>
            </Col>
          </Row>
          <FilterForm onFilter={handleFilter} />
          <Row className="mb-4 align-items-center">
            <Col>
              {sortedItems !== null && (
                <Badge bg={sortedItems.length > 0 ? 'primary' : 'secondary'}>
                  {sortedItems.length} result
                  {sortedItems.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </Col>
            <Col className="d-flex align-items-center gap-2" xs="auto">
              <Form.Select
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                size="sm"
                style={{ width: 'auto' }}
                value={sortKey}
              >
                <option value="none">Default order</option>
                <option value="name">Name A→Z</option>
                <option value="ilvl">Item Level ↓</option>
                <option value="stashTab">Stash Tab A→Z</option>
                <option value="stackSize">Stack Size ↓</option>
              </Form.Select>
              <Button onClick={handleGridClick}>
                <FontAwesomeIcon icon={faGridVertical} />
              </Button>{' '}
              <Button onClick={handleListClick}>
                <FontAwesomeIcon icon={faListDots} />
              </Button>
            </Col>
          </Row>
          <Row>
            {sortedItems === null ? (
              <Col className="text-center text-muted">
                Run a search to see results
              </Col>
            ) : sortedItems.length ? (
              sortedItems.map((item) =>
                displayMode === DisplayMode.Grid ? (
                  <GridItem item={item} key={item.id} />
                ) : (
                  <ListItem item={item} key={item.id} />
                )
              )
            ) : (
              <Col className="text-center">No results</Col>
            )}
          </Row>
        </Fragment>
      ) : (
        <Fragment>
          <Row>
            <Col sm={6} xs={12}>
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
            <Col className="text-end" sm={6} xs={12}>
              <Spinner />
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              Approximately{' '}
              {formatDistanceToNow(addSeconds(new Date(), timeEstimate))}
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <ProgressBar
                animated
                max={queries.length}
                min={1}
                now={fetched}
              />
            </Col>
          </Row>
        </Fragment>
      )}
    </Layout>
  );
}
