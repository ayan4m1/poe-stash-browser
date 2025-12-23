import { Form } from 'react-bootstrap';

import Layout from '../components/Layout';

export default function Settings() {
  return (
    <Layout>
      <h1>Settings</h1>
      <Form>
        <Form.Group>
          <Form.Label>Hours to cache stash tabs for</Form.Label>
          <Form.Control
            type="number"
            name="cacheHours"
            min={1}
            max={192}
            step={1}
          />
        </Form.Group>
      </Form>
    </Layout>
  );
}
