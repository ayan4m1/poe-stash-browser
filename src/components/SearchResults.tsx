import { Fragment, useCallback, useState } from 'react';
import { Badge, Button, Col, Form, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { DisplayMode, Item, SortKey } from '../types';
import { faGridVertical, faListDots } from '@fortawesome/free-solid-svg-icons';
import GridItem from './GridItem';
import ListItem from './ListItem';

interface IProps {
  items: Item[] | null;
  onSortChange: (key: SortKey) => void;
  sortKey: SortKey;
}

export default function SearchResults({
  items,
  onSortChange,
  sortKey
}: IProps) {
  const defaultDisplayMode = localStorage.getItem(
    'app.defaultDisplayMode'
  ) as DisplayMode;
  const [displayMode, setDisplayMode] = useState(defaultDisplayMode);

  const handleGridClick = useCallback(
    () => setDisplayMode(DisplayMode.Grid),
    []
  );
  const handleListClick = useCallback(
    () => setDisplayMode(DisplayMode.List),
    []
  );

  return (
    <Fragment>
      <Row className="mb-4 align-items-center">
        <Col>
          {items !== null && (
            <Badge bg={items.length > 0 ? 'primary' : 'secondary'}>
              {items.length} result
              {items.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </Col>
        <Col className="d-flex align-items-center gap-2" xs="auto">
          <Form.Select
            onChange={(e) => onSortChange(e.target.value as SortKey)}
            size="sm"
            style={{ width: 'auto' }}
            value={sortKey}
          >
            <option value="none">Default</option>
            <option value="name">Name A-Z</option>
            <option value="ilvl">Item Level</option>
            <option value="stashTab">Stash Tab A-Z</option>
            <option value="stackSize">Stack Size</option>
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
        {items === null ? (
          <Col className="text-center text-muted">
            Run a search to see results
          </Col>
        ) : items.length ? (
          items.map((item) =>
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
  );
}
