import { Card, Col } from 'react-bootstrap';

import { Item } from '../types';

interface IProps {
  item: Item;
}

export default function Item({ item }: IProps) {
  return (
    <Col className="mb-2" xs={12}>
      <Card>
        <Card.Header>
          <Card.Title>
            {item.name} {item.typeLine}{' '}
            {item.stackSize ? `(${item.stackSize})` : null}
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <img src={item.icon} />
        </Card.Body>
      </Card>
    </Col>
  );
}
