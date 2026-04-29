import { useMemo } from 'react';
import { Card, Col, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';

import ModList from './ModList';
import { Item, ItemRarity, rarityColors } from '../types';
import { shouldUseSlimDisplay } from '../utils';

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
    <Col className="mb-2 d-flex" xs={12} sm={4} md={3}>
      <Card
        style={{
          borderRadius: 16,
          backgroundColor: 'black',
          color: 'white',
          flexGrow: 1
        }}
      >
        <OverlayTrigger
          placement="bottom"
          overlay={(props) => <Tooltip {...props}>{item?.stashTab}</Tooltip>}
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
