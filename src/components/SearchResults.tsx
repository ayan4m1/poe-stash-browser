import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Badge, Button, Col, Form, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { List, RowComponentProps, useDynamicRowHeight } from 'react-window';

import { DisplayMode, Item, SortKey } from '../types';
import { faGridVertical, faListDots } from '@fortawesome/free-solid-svg-icons';
import GridItem from './GridItem';
import ListItem from './ListItem';

// Bootstrap's sm and md breakpoints, so a virtual row holds exactly as many
// items as the md={3} sm={4} xs={12} columns GridItem renders itself into.
const gridColumnsForWidth = (width: number) =>
  width >= 768 ? 4 : width >= 576 ? 3 : 1;

// Only a starting guess - every row is measured once it has rendered, so these
// affect the scrollbar for parts of the list you have not scrolled to yet.
const estimatedRowHeights: Record<DisplayMode, number> = {
  [DisplayMode.Grid]: 420,
  [DisplayMode.List]: 260
};

// The list is its own scroll container rather than part of the page flow, so it
// needs a floor to fall back on before it has been measured.
const minListHeight = 320;

interface RowProps {
  columnCount: number;
  displayMode: DisplayMode;
  items: Item[];
}

function ItemRow({
  ariaAttributes,
  columnCount,
  displayMode,
  index,
  items,
  style
}: RowComponentProps<RowProps>) {
  const start = index * columnCount;

  return (
    <div style={style} {...ariaAttributes}>
      {/* mx-0 because the row sits in the list's own scroll box rather than
          inside the page Container whose padding its negative margins cancel. */}
      <Row className="mx-0">
        {items
          .slice(start, start + columnCount)
          .map((item) =>
            displayMode === DisplayMode.Grid ? (
              <GridItem item={item} key={item.id} />
            ) : (
              <ListItem item={item} key={item.id} />
            )
          )}
      </Row>
    </div>
  );
}

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
  const [listHeight, setListHeight] = useState(minListHeight);
  const [gridColumns, setGridColumns] = useState(() =>
    gridColumnsForWidth(window.innerWidth)
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const handleGridClick = useCallback(
    () => setDisplayMode(DisplayMode.Grid),
    []
  );
  const handleListClick = useCallback(
    () => setDisplayMode(DisplayMode.List),
    []
  );

  // The list runs to the bottom of the window from wherever it starts, which
  // moves as the filter form above it opens and closes.
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const measure = () => {
      const { top } = container.getBoundingClientRect();

      setGridColumns(gridColumnsForWidth(window.innerWidth));
      setListHeight((prev) => {
        const next = Math.max(minListHeight, window.innerHeight - top - 16);

        // Guard against a resize observer loop - the list only ever grows to
        // the height we hand it, but rounding can leave a sub-pixel delta.
        return Math.abs(next - prev) < 1 ? prev : next;
      });
    };

    measure();

    const observer = new ResizeObserver(measure);

    observer.observe(document.body);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  const columnCount = displayMode === DisplayMode.Grid ? gridColumns : 1;
  const rowProps: RowProps = useMemo(
    () => ({ columnCount, displayMode, items: items ?? [] }),
    [columnCount, displayMode, items]
  );
  // Item heights are not knowable up front - ModList renders however many mods
  // an item happens to carry - so rows are measured as they render. Re-sorting
  // or re-laying out puts different items at each index, which invalidates
  // every cached height, so the key drops the cache.
  const rowHeight = useDynamicRowHeight({
    defaultRowHeight:
      estimatedRowHeights[displayMode] ?? estimatedRowHeights[DisplayMode.List],
    key: `${displayMode}-${sortKey}-${columnCount}-${items?.length ?? 0}`
  });
  const rowKey = useCallback(
    (index: number, { columnCount, items }: RowProps) =>
      items[index * columnCount]?.id ?? index,
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
      <div ref={containerRef}>
        {items === null ? (
          <Row>
            <Col className="text-center text-muted">
              Run a search to see results
            </Col>
          </Row>
        ) : !items.length ? (
          <Row>
            <Col className="text-center">No results</Col>
          </Row>
        ) : (
          <List
            rowComponent={ItemRow}
            rowCount={Math.ceil(items.length / columnCount)}
            rowHeight={rowHeight}
            rowKey={rowKey}
            rowProps={rowProps}
            style={{ height: listHeight }}
          />
        )}
      </div>
    </Fragment>
  );
}
