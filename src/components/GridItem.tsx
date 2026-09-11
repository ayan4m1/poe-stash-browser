import { useMemo } from 'react';
import {
  ButtonGroup,
  Card,
  Col,
  OverlayTrigger,
  Row,
  Tooltip
} from 'react-bootstrap';

import ModList from './ModList';
import PriceButton from './PriceButton';
import PriceLabel from './PriceLabel';
import SaveButton from './SaveButton';
import useItemValue from '../hooks/useItemValue';
import useAppContext from '../hooks/useAppContext';
import { Item, ItemRarity } from '../types';
import { rarityColors, shouldUseSlimDisplay } from '../utils';
import useSaveToggle from '../hooks/useSaveToggle';

interface IProps {
  item: Item;
}

export default function GridItem({ item }: IProps) {
  const { savedItems } = useAppContext();
  const color = useMemo(
    () => rarityColors[item.rarity ?? ItemRarity.Normal],
    [item]
  );
  const slimDisplay = useMemo(() => shouldUseSlimDisplay(item), [item]);
  const saved = useMemo(
    () => savedItems?.includes(item.id),
    [savedItems, item]
  );
  const handleSaveToggle = useSaveToggle(item, saved);
  const {
    fetch: fetchValue,
    isError,
    isPending,
    reason,
    value
  } = useItemValue(item);

  return (
    <Col className="mb-2 d-flex" md={3} sm={4} xs={12}>
      <Card
        style={{
          borderRadius: 16,
          backgroundColor: 'black',
          color: 'white',
          flexGrow: 1
        }}
      >
        <OverlayTrigger
          overlay={(props) => <Tooltip {...props}>{item?.stashTab}</Tooltip>}
          placement="bottom"
        >
          <Card.Header style={{ backgroundColor: '#262323' }}>
            <Card.Title className="text-center" style={{ color }}>
              <div className="text-end mb-2">
                <ButtonGroup>
                  <PriceButton
                    isError={isError}
                    isPending={isPending}
                    onPriceClick={fetchValue}
                    reason={reason}
                    value={value}
                  />
                  <SaveButton
                    item={item}
                    onSaveToggle={handleSaveToggle}
                    saved={saved}
                  />
                </ButtonGroup>
              </div>
              <p>
                <img
                  src={item.icon}
                  style={{ minHeight: '141px', objectFit: 'scale-down' }}
                />
              </p>
              <p>
                {item.name} {item.typeLine}{' '}
                {item.stackSize ? `(${item.stackSize})` : null}
              </p>
              <PriceLabel isError={isError} reason={reason} value={value} />
            </Card.Title>
          </Card.Header>
        </OverlayTrigger>
        {!slimDisplay && (
          <Card.Body>
            <Row className="text-center">
              <Col>
                <ModList item={item} />
              </Col>
            </Row>
          </Card.Body>
        )}
      </Card>
    </Col>
  );
}
