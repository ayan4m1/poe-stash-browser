import { ListGroup } from 'react-bootstrap';

import Layout from '../components/Layout';
import useStashes from '../hooks/useStashes';
import useAppContext from '../hooks/useAppContext';

export default function Stashes() {
  const { selectedLeague } = useAppContext();
  const { data } = useStashes(selectedLeague?.id);

  return (
    <Layout>
      <h1>Stashes</h1>
      <ListGroup>
        {selectedLeague ? (
          data ? (
            data.stashes.map((stash) => (
              <ListGroup.Item key={stash.id}>{stash.name}</ListGroup.Item>
            ))
          ) : (
            <p>Waiting for data...</p>
          )
        ) : (
          <p>Select a league first</p>
        )}
      </ListGroup>
    </Layout>
  );
}
