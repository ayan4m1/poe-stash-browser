import { Card, ListGroup } from 'react-bootstrap';

import Layout from '../components/Layout';

export default function Home() {
  return (
    <Layout>
      <Card bg="secondary">
        <Card.Header>
          <Card.Title>Features</Card.Title>
        </Card.Header>
        <Card.Body>
          <ListGroup>
            <ListGroup.Item>Sync your stash</ListGroup.Item>
            <ListGroup.Item>Search and filter</ListGroup.Item>
          </ListGroup>
        </Card.Body>
      </Card>
    </Layout>
  );
}
