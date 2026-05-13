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
                <Col sm={2} xs={12}>
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
