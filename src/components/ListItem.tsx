import { Card, Col, Container, Row } from 'react-bootstrap';

import { Item } from '../types';

interface IProps {
  item: Item;
}

export default function ListItem({ item }: IProps) {
  return (
    <Col xs={12} className="mb-2">
      <Card>
        <Card.Body>
          <Container fluid>
            <Row>
              <Col xs={12} sm={4}>
                <p>
                  <img src={item.icon} />
                </p>
                <p>
                  {item.name} {item.typeLine}{' '}
                  {item.stackSize ? `(${item.stackSize})` : null}
                </p>
              </Col>
            </Row>
          </Container>
        </Card.Body>
      </Card>
    </Col>
  );
}
