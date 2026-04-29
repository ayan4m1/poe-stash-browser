import { Button, Form } from 'react-bootstrap';
import { useQueryClient } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';

import Layout from '../components/Layout';
import { FormikErrors, useFormik } from 'formik';
import { SettingsForm } from '../types';

export default function Settings() {
  const queryClient = useQueryClient();

  const { values, handleChange, handleSubmit } = useFormik({
    initialValues: {
      cacheHours:
        (queryClient.getDefaultOptions().queries?.gcTime ?? 0) / 1000 / 3600 // milliseconds into hours
    },
    validate: ({ cacheHours }) => {
      const result: FormikErrors<SettingsForm> = {};

      if (cacheHours < 1 || cacheHours > 192) {
        result.cacheHours = 'Cache must be from 1-192 hours';
      }

      return result;
    },
    onSubmit: ({ cacheHours }) => {
      queryClient.setDefaultOptions({
        queries: {
          gcTime: cacheHours * 3600 * 1000 // hours into milliseconds
        }
      });
    }
  });

  return (
    <Layout>
      <h1>Settings</h1>
      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label>Hours to cache stash tabs for</Form.Label>
          <Form.Control
            max={192}
            min={1}
            name="cacheHours"
            onChange={handleChange}
            step={1}
            type="number"
            value={values.cacheHours}
          />
        </Form.Group>
        <Form.Group className="my-4">
          <Button type="submit">
            <FontAwesomeIcon icon={faCheckCircle} /> Save
          </Button>
        </Form.Group>
      </Form>
    </Layout>
  );
}
