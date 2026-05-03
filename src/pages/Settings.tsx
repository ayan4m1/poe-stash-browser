import { MouseEvent, useCallback } from 'react';
import { FormikErrors, useFormik } from 'formik';
import { useQueryClient } from '@tanstack/react-query';
import { Button, ButtonGroup, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faGridVertical,
  faListDots
} from '@fortawesome/free-solid-svg-icons';

import Layout from '../components/Layout';
import { DisplayMode, SettingsForm } from '../types';

export default function Settings() {
  const queryClient = useQueryClient();

  const { errors, values, handleChange, handleSubmit, setFieldValue } =
    useFormik({
      initialValues: {
        defaultDisplayMode:
          (localStorage.getItem('app.defaultDisplayMode') as DisplayMode) ??
          DisplayMode.Grid,
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
      onSubmit: ({ defaultDisplayMode, cacheHours }) => {
        localStorage.setItem('app.defaultDisplayMode', defaultDisplayMode);
        localStorage.setItem('app.cacheHours', cacheHours.toString());
        const options = queryClient.getDefaultOptions();

        const gcTime = cacheHours * 3600 * 1000; // hours into milliseconds

        // only burst cache if the gc time changed
        if (options.queries?.gcTime !== gcTime) {
          queryClient.setDefaultOptions({
            queries: {
              gcTime
            }
          });
        }
      }
    });
  const handleDisplayModeClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      setFieldValue(
        'defaultDisplayMode',
        event.currentTarget.name as DisplayMode
      );
    },
    [setFieldValue]
  );

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
          {Boolean(errors.cacheHours) && (
            <Form.Control.Feedback type="invalid">
              {errors.cacheHours}
            </Form.Control.Feedback>
          )}
        </Form.Group>
        <Form.Group>
          <Form.Label>Default viewing mode</Form.Label>
          <div>
            <ButtonGroup>
              <Button
                className="text-white"
                name="grid"
                onClick={handleDisplayModeClick}
                variant={
                  values.defaultDisplayMode === DisplayMode.Grid
                    ? 'primary'
                    : 'outline-primary'
                }
              >
                <FontAwesomeIcon icon={faGridVertical} /> Grid
              </Button>
              <Button
                className="text-white"
                name="list"
                onClick={handleDisplayModeClick}
                variant={
                  values.defaultDisplayMode === DisplayMode.List
                    ? 'primary'
                    : 'outline-primary'
                }
              >
                <FontAwesomeIcon icon={faListDots} /> List
              </Button>
            </ButtonGroup>
          </div>
        </Form.Group>
        <Form.Group className="my-4 text-end">
          <Button type="submit">
            <FontAwesomeIcon icon={faCheckCircle} /> Save
          </Button>
        </Form.Group>
      </Form>
    </Layout>
  );
}
