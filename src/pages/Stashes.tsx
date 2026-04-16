import { useFormik } from 'formik';
import {
  ChangeEvent,
  Fragment,
  KeyboardEvent,
  useCallback,
  useMemo,
  useState
} from 'react';
import {
  addSeconds,
  intervalToDuration,
  formatDuration,
  interval
} from 'date-fns';
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
import {
  FilterForm,
  ItemRarity,
  ItemType as ItemTypes,
  Item as ItemType
} from '../types';
import { buildItemText } from '../utils';

export default function Stashes() {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<ItemType[]>([]);
  const { selectedLeague } = useAppContext();
  const { data } = useStashes(selectedLeague?.id);
  const { queries, requestTime } = useStashItems(
    selectedLeague?.id,
    data?.stashes
  );
  const doneFetching = useMemo(
    () => queries.every((query) => query.isFetched && !query.isRefetching),
    [queries]
  );
  const handleRefetchClick = useCallback(
    () => queries.forEach((query) => query.refetch()),
    [queries]
  );
  const handleQueryChange = useCallback(
    (e: ChangeEvent) => setQuery((e.target as HTMLFormElement).value),
    []
  );
  const { values, handleChange, handleSubmit } = useFormik<FilterForm>({
    initialValues: {
      rarity: undefined,
      type: undefined
    },
    onSubmit: useCallback(
      ({ rarity, type }) => {
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
            const slug = buildItemText(item);

            let valid = queryMatcher.test(slug);

            console.dir(rarity);

            if (rarity) {
              valid = item.rarity === rarity;
            }

            if (type) {
              if (!item.properties?.length) {
                valid = false;
              } else {
                const { name } = item.properties[0];

                valid = name === type;
              }
            }

            if (valid) {
              items.push(item);
            }
          }
        }

        setFilteredItems(items);
      },
      [doneFetching, queries, query]
    )
  });
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.code !== 'Enter') {
        return;
      }

      handleSubmit();
    },
    [handleSubmit]
  );
  const fetchEstimate = useMemo(() => {
    const time =
      queries.filter((query) => !query.isFetched || query.isRefetching).length *
      (requestTime / 1e3);

    return (
      formatDuration(
        intervalToDuration(interval(new Date(), addSeconds(new Date(), time)))
      ) || 'Unknown'
    );
  }, [requestTime, queries]);
  const fetched = useMemo(
    () =>
      queries.filter((query) => query.isFetched && !query.isRefetching).length,
    [queries]
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
          <Form onSubmit={handleSubmit}>
            <Form.Group>
              <Form.Label>Rarity:</Form.Label>
              <Form.Select
                name="rarity"
                onChange={handleChange}
                value={values.rarity}
              >
                <option>Any</option>
                {Object.values(ItemRarity).map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {rarity}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Item Type:</Form.Label>
              <Form.Select
                name="type"
                onChange={handleChange}
                value={values.type}
              >
                <option>Any</option>
                {Object.entries(ItemTypes).map(([value, key]) => (
                  <option key={key} value={value}>
                    {key}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <InputGroup className="my-4">
                <InputGroup.Text>Query</InputGroup.Text>
                <Form.Control
                  type="text"
                  name="query"
                  onKeyDown={handleKeyDown}
                  value={query}
                  onChange={handleQueryChange}
                />
                <Button type="submit">Search</Button>
              </InputGroup>
            </Form.Group>
          </Form>
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
              <h4>Fetching {queries.length} stash tabs&hellip;</h4>
            </Col>
            <Col xs={12} sm={6} className="text-end">
              <Spinner className="text-center" />
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              Approximate time remaining: {fetchEstimate}
              <ProgressBar min={1} now={fetched} max={queries.length} />
            </Col>
          </Row>
        </Fragment>
      )}
    </Layout>
  );
}
