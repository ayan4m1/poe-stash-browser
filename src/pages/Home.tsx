import { Fragment } from 'react';
import { Card, ListGroup, ListGroupItem } from 'react-bootstrap';

export default function Home() {
  return (
    <Fragment>
      <h2 className="mb-4">Path of Exile Stash Browser</h2>
      <Card>
        <h3>Features</h3>
        <ListGroup>
          <ListGroupItem>Sync your stash</ListGroupItem>
          <ListGroupItem>Search and filter</ListGroupItem>
        </ListGroup>
      </Card>
    </Fragment>
  );
}
