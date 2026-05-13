import { useMemo } from 'react';
import { Card, Col, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';

import ModList from './ModList';
import { Item, ItemRarity } from '../types';
import { rarityColors, shouldUseSlimDisplay } from '../utils';

interface IProps {
  item: Item;
}

export default function GridItem({ item }: IProps) {
  const color = useMemo(
    () => rarityColors[item.rarity ?? ItemRarity.Normal],
    [item]
  );

  const slimDisplay = useMemo(() => shouldUseSlimDisplay(item), [item]);

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
              <p>
                <img src={item.icon} />
              </p>
              <p>
                {item.name} {item.typeLine}{' '}
                {item.stackSize ? `(${item.stackSize})` : null}
              </p>
            </Card.Title>
          </Card.Header>
        </OverlayTrigger>
        {!slimDisplay && (
          <Card.Body>
            <Row className="text-center">
              <Col xs={12}>
                <ModList item={item} />
              </Col>
            </Row>
          </Card.Body>
        )}
      </Card>
    </Col>
  );
}
