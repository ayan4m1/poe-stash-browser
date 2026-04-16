import {
  ChangeEvent,
  Fragment,
  KeyboardEvent,
  useCallback,
  useMemo,
  useState
} from 'react';
import {
  Button,
  Col,
  Container,
  Form,
  InputGroup,
  ProgressBar,
  Row,
  Spinner
} from 'react-bootstrap';

import Item from '../components/Item';
import Layout from '../components/Layout';
import useStashes from '../hooks/useStashes';
import useAppContext from '../hooks/useAppContext';
import useStashItems from '../hooks/useStashItems';
import { Item as ItemType } from '../types';
import {
  addSeconds,
  intervalToDuration,
  formatDuration,
  interval
} from 'date-fns';

export default function Stashes() {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<ItemType[]>([]);
  const { selectedLeague } = useAppContext();
  const { data } = useStashes(selectedLeague?.id);
  const { queries, requestTime } = useStashItems(
    selectedLeague?.id,
    data?.stashes
  );
  const doneFetching = queries.every(
    (query) => query.isFetched && !query.isRefetching
  );
  const handleRefetchClick = useCallback(
    () => queries.forEach((query) => query.refetch()),
    [queries]
  );
  const handleQueryChange = useCallback(
    (e: ChangeEvent) => setQuery((e.target as HTMLFormElement).value),
    []
  );
  const handleSearchClick = useCallback(() => {
    if (!doneFetching) {
      return;
    }

    const queryMatcher = new RegExp(query, 'i');
    const items: ItemType[] = [];

    for (const query of queries) {
      if (!query?.data?.stash?.items?.length) {
        continue;
      }

      for (const item of query.data.stash.items) {
        const slug = `${item.name} ${item.typeLine}
${item.implicitMods?.join('\n')}
${item.explicitMods?.join('\n')}
${item.craftedMods?.join('\n')}
`;

        if (queryMatcher.test(slug)) {
          items.push(item);
        }
      }
    }

    setFilteredItems(items);
  }, [doneFetching, queries, query]);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.code !== 'Enter') {
        return;
      }

      handleSearchClick();
    },
    [handleSearchClick]
  );
  const fetchEstimate = useMemo(
    () =>
      queries.filter((query) => !query.isFetched || query.isRefetching).length *
      (requestTime / 1e3),
    [requestTime, queries]
  );

  return (
    <Layout>
      <h1>My Stashes</h1>
      {!selectedLeague ? (
        <p>Select a league first</p>
      ) : doneFetching ? (
        <Fragment>
          <Button variant="danger" onClick={handleRefetchClick}>
            Refetch
          </Button>
          <InputGroup className="my-4">
            <InputGroup.Text>Query</InputGroup.Text>
            <Form.Control
              type="text"
              name="query"
              onKeyDown={handleKeyDown}
              value={query}
              onChange={handleQueryChange}
            />
            <Button onClick={handleSearchClick}>Search</Button>
          </InputGroup>
          <Container fluid>
            <Row>
              {filteredItems.map((item) => (
                <Item key={item.id} item={item} />
              ))}
            </Row>
          </Container>
        </Fragment>
      ) : (
        <Fragment>
          <Row>
            <Col xs={12} sm={6}>
              <h4>Fetching stash tabs&hellip;</h4>
            </Col>
            <Col xs={12} sm={6} className="text-end">
              <Spinner className="text-center" />
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              Approximate time remaining:{' '}
              {formatDuration(
                intervalToDuration(
                  interval(new Date(), addSeconds(new Date(), fetchEstimate))
                )
              ) || 'Unknown'}
              <ProgressBar
                min={1}
                now={
                  queries.filter(
                    (query) => query.isFetched && !query.isRefetching
                  ).length
                }
                max={queries.length}
              />
            </Col>
          </Row>
        </Fragment>
      )}
    </Layout>
  );
}
