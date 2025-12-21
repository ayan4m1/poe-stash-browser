import { Fragment } from 'react';
import { ProgressBar, Spinner } from 'react-bootstrap';

import Layout from '../components/Layout';
import useStashes from '../hooks/useStashes';
import useAppContext from '../hooks/useAppContext';
import useStashItems from '../hooks/useStashItems';

export default function Stashes() {
  const { selectedLeague } = useAppContext();
  const { data } = useStashes(selectedLeague?.id);
  const queries = useStashItems(selectedLeague?.id, data?.stashes);

  const doneFetching = queries.every((query) => query.isFetched);

  return (
    <Layout>
      <h1>Stashes</h1>
      {!selectedLeague && <p>Select a league first</p>}
      {doneFetching ? (
        <p></p>
      ) : (
        <Fragment>
          <h4>Fetching stash tabs&hellip;</h4>
          <Spinner className="text-center" />
          <ProgressBar
            min={1}
            now={queries.filter((query) => query.isFetched).length}
            max={queries.length}
          />
        </Fragment>
      )}
    </Layout>
  );
}
