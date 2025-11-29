import { useContext } from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { AuthContext, IAuthContext } from 'react-oauth2-code-pkce';

import Layout from '../components/Layout';

export default function Home() {
  const { token } = useContext<IAuthContext>(AuthContext);

  return (
    <Layout>
      <Card bg="secondary">
        <Card.Header>
          <Card.Title>Features</Card.Title>
        </Card.Header>
        <Card.Body>
          <h4>{token}</h4>
          <ListGroup>
            <ListGroup.Item>Sync your stash</ListGroup.Item>
            <ListGroup.Item>Search and filter</ListGroup.Item>
          </ListGroup>
        </Card.Body>
      </Card>
    </Layout>
  );
}
