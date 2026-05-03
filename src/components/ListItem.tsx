import { useMemo } from 'react';
import {
  Card,
  Col,
  Container,
  OverlayTrigger,
  Row,
  Tooltip
} from 'react-bootstrap';

import { Item, ItemRarity } from '../types';
import { rarityColors, shouldUseSlimDisplay } from '../utils';
import ModList from './ModList';

interface IProps {
  item: Item;
}

export default function ListItem({ item }: IProps) {
  const color = useMemo(
    () => rarityColors[item.rarity ?? ItemRarity.Normal],
    [item]
  );
  const slimDisplay = useMemo(() => shouldUseSlimDisplay(item), [item]);

  return (
    <Col xs={12} className="mb-2">
      <Card style={{ backgroundColor: '#262323' }}>
        <Card.Body>
          <Container fluid>
            <Row>
              <OverlayTrigger
                placement="right"
                overlay={(props) => (
                  <Tooltip {...props}>{item?.stashTab}</Tooltip>
                )}
              >
                <Col xs={12} sm={2}>
                  <p className="text-center">
                    <img src={item.icon} />
                  </p>
                  <h5 className="text-center" style={{ color }}>
                    {item.name} {item.typeLine}{' '}
                    {item.stackSize ? `(${item.stackSize})` : null}
                  </h5>
                </Col>
              </OverlayTrigger>
              {!slimDisplay && (
                <Col xs={12} sm={10}>
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
