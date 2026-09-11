import { useMemo } from 'react';
import {
  Card,
  Col,
  Container,
  OverlayTrigger,
  Row,
  Tooltip
} from 'react-bootstrap';

import ModList from './ModList';
import PriceButton from './PriceButton';
import SaveButton from './SaveButton';
import useAppContext from '../hooks/useAppContext';
import useItemValue from '../hooks/useItemValue';
import useSaveToggle from '../hooks/useSaveToggle';
import { Item, ItemRarity } from '../types';
import { rarityColors, shouldUseSlimDisplay } from '../utils';

interface IProps {
  item: Item;
}

export default function ListItem({ item }: IProps) {
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
    <Col className="mb-2" xs={12}>
      <Card style={{ backgroundColor: '#262323' }}>
        <Card.Body>
          <Container fluid>
            <Row>
              <OverlayTrigger
                overlay={(props) => (
                  <Tooltip {...props}>{item?.stashTab}</Tooltip>
                )}
                placement="right"
              >
                <Col className="text-center" sm={2} xs={12}>
                  <SaveButton
                    item={item}
                    onSaveToggle={handleSaveToggle}
                    saved={saved}
                  />
                  <p>
                    <img src={item.icon} />
                  </p>
                  <h5 style={{ color }}>
                    {item.name} {item.typeLine}{' '}
                    {item.stackSize ? `(${item.stackSize})` : null}
                  </h5>
                  <PriceButton
                    isError={isError}
                    isPending={isPending}
                    onPriceClick={fetchValue}
                    reason={reason}
                    value={value}
                  />
                </Col>
              </OverlayTrigger>
              {!slimDisplay && (
                <Col sm={10} xs={12}>
                  <ModList item={item} />
                </Col>
              )}
            </Row>
          </Container>
        </Card.Body>
      </Card>
    </Col>
  );
}
