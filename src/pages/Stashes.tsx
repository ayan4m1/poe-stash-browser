import { ChangeEvent, useCallback } from 'react';
import { Form, Spinner } from 'react-bootstrap';

import Layout from '../components/Layout';
import useStashes from '../hooks/useStashes';
import useAppContext from '../hooks/useAppContext';
import useStashItems from '../hooks/useStashItems';

export default function Stashes() {
  const { selectedLeague, selectedStash, setSelectedStash } = useAppContext();
  const { data } = useStashes(selectedLeague?.id);
  const { data: itemData } = useStashItems(
    selectedLeague?.id,
    selectedStash?.id
  );
  const handleStashChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      const stash = data.stashes.find((stash) => stash.id === e.target.value);

      if (!stash) {
        return;
      }

      setSelectedStash(stash);
    },
    [setSelectedStash, data]
  );

  console.dir(itemData);

  return (
    <Layout>
      <h1>Stashes</h1>
      {selectedLeague ? (
        data ? (
          <Form.Select onChange={handleStashChange}>
            {data.stashes.map((stash) => (
              <option key={stash.id} value={stash.id}>
                {stash.name} ({stash.type})
              </option>
            ))}
          </Form.Select>
        ) : (
          <Spinner />
        )
      ) : (
        <p>Select a league first</p>
      )}
      {itemData
        ? itemData.stash.items.map((item) => (
            <p key={item.id}>
              <img src={item.icon} /> {item.name} {item.typeLine}
            </p>
          ))
        : null}
    </Layout>
  );
}
