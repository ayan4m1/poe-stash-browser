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
import { interpolateProperties } from '../utils';

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
                <ListGroup>
                  {item.properties?.map((property) => {
                    if (property.name.startsWith('Currently')) {
                      return null;
                    }

                    return (
                      <ListGroup.Item key={property.name}>
                        {interpolateProperties(property)}
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
                {Boolean(item.properties?.length) && <hr />}
                <ListGroup>
                  {item.ilvl > 0 && (
                    <ListGroup.Item>Item Level: {item.ilvl}</ListGroup.Item>
                  )}
                  {item.requirements?.map((requirement) => (
                    <ListGroup.Item key={requirement.name}>
                      {interpolateProperties(requirement, true)}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
                {(item.ilvl > 0 || item.requirements?.length) && <hr />}
              </Col>
              <Col xs={12}>
                <ListGroup>
                  {item.implicitMods?.map((implicit) => (
                    <ListGroup.Item key={implicit}>{implicit}</ListGroup.Item>
                  ))}
                </ListGroup>
                {Boolean(
                  item.implicitMods?.length && item.explicitMods?.length
                ) && <hr />}
                <ListGroup>
                  {item.explicitMods?.map((explicit) => (
                    <ListGroup.Item key={explicit}>{explicit}</ListGroup.Item>
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
