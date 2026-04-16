import { useMemo } from 'react';
import {
  Card,
  Col,
  ListGroup,
  OverlayTrigger,
  Row,
  Tooltip
} from 'react-bootstrap';

import { Item, ItemFrameType, ItemRarity } from '../types';

interface IProps {
  item: Item;
}

export default function Item({ item }: IProps) {
  const color = useMemo(() => {
    switch (item.rarity) {
      case ItemRarity.Magic:
        return '#6e6ed0';
      case ItemRarity.Rare:
        return '#ffff81';
      case ItemRarity.Unique:
        return '#ae6135';
      default:
      case ItemRarity.Normal:
        return '#fefefe';
    }
  }, [item]);

  const slimDisplay = [
    ItemFrameType.Currency,
    ItemFrameType.DivinationCard,
    ItemFrameType.Gem
  ].includes(item.frameType);

  return (
    <Col className="mb-2 d-flex" xs={12} sm={4} md={3}>
      <Card
        style={{
          borderRadius: 8,
          backgroundColor: 'black',
          color: 'white',
          flexGrow: 1
        }}
      >
        <Card.Header style={{ backgroundColor: '#262323' }}>
          <Card.Title className="text-center" style={{ color }}>
            <p>
              <img src={item.icon} />
            </p>
            <OverlayTrigger
              placement="bottom"
              overlay={(props) => (
                <Tooltip {...props}>{item?.stashTab?.name}</Tooltip>
              )}
            >
              <p>
                {item.name} {item.typeLine}{' '}
                {item.stackSize ? `(${item.stackSize})` : null}
              </p>
            </OverlayTrigger>
          </Card.Title>
        </Card.Header>
        {!slimDisplay && (
          <Card.Body>
            <Row className="text-center">
              <Col xs={12}>
                {item.ilvl > 0 && <p>Item Level: {item.ilvl}</p>}
                {Boolean(item.itemLevel) && (
                  <p>Requires Level {item.itemLevel}</p>
                )}
              </Col>
              <Col xs={12}>
                <ListGroup>
                  {item.implicitMods?.map((implicit) => (
                    <ListGroup.Item>{implicit}</ListGroup.Item>
                  ))}
                  {Boolean(
                    item.implicitMods?.length && item.explicitMods?.length
                  ) && <hr />}
                  {item.explicitMods?.map((explicit) => (
                    <ListGroup.Item>{explicit}</ListGroup.Item>
                  ))}
                </ListGroup>
              </Col>
            </Row>
          </Card.Body>
        )}
      </Card>
    </Col>
  );
}
