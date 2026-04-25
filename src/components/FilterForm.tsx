import { useFormik } from 'formik';
import { Button, Form } from 'react-bootstrap';
import { ChangeEvent, KeyboardEvent, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faPlusCircle
} from '@fortawesome/free-solid-svg-icons';

import FilterQueryRow from './FilterQueryRow';
import {
  BooleanMode,
  FilterForm as FilterFormType,
  ItemFrameType,
  ItemFrameTypeNames,
  ItemRarity,
  ItemType as ItemTypes
} from '../types';

interface FilterFormProps {
  onFilter: (values: FilterFormType) => void;
}

const validate = (values: FilterFormType) => {
  const errors: { queries?: Array<{ value?: string }> } = {};
  const queryErrors: Array<{ value?: string }> = [];
  let hasError = false;

  for (const q of values.queries) {
    const qError: { value?: string } = {};
    if (q.value.trim() !== '') {
      try {
        new RegExp(q.value);
      } catch {
        qError.value = 'Invalid regex pattern';
        hasError = true;
      }
    }
    queryErrors.push(qError);
  }

  if (hasError) {
    errors.queries = queryErrors;
  }

  return errors;
};

export default function FilterForm({ onFilter }: FilterFormProps) {
  const { values, errors, handleChange, handleSubmit, setFieldValue } =
    useFormik<FilterFormType>({
      initialValues: {
        rarity: undefined,
        itemType: undefined,
        frameType: undefined,
        queries: [{ id: crypto.randomUUID(), value: '' }]
      },
      validate,
      onSubmit: (values) => onFilter(values)
    });

  const handleAddQuery = useCallback(() => {
    setFieldValue('queries', [
      ...values.queries,
      { id: crypto.randomUUID(), value: '', mode: 'and' as BooleanMode }
    ]);
  }, [values.queries, setFieldValue]);

  const handleValueChange = useCallback(
    (id: string, value: string) => {
      const index = values.queries.findIndex((q) => q.id === id);
      if (index >= 0) {
        setFieldValue(`queries.${index}.value`, value);
      }
    },
    [values.queries, setFieldValue]
  );

  const handleModeChange = useCallback(
    (id: string, mode: BooleanMode) => {
      const index = values.queries.findIndex((q) => q.id === id);
      if (index >= 0) {
        setFieldValue(`queries.${index}.mode`, mode);
      }
    },
    [values.queries, setFieldValue]
  );

  const handleRemove = useCallback(
    (id: string) => {
      setFieldValue(
        'queries',
        values.queries.filter((q) => q.id !== id)
      );
    },
    [values.queries, setFieldValue]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleSelectChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const { value, name } = event.target;
      if (value === 'any') {
        setFieldValue(name, undefined);
      } else {
        handleChange(event);
      }
    },
    [handleChange, setFieldValue]
  );

  const queryErrors = errors?.queries as Array<{ value?: string }> | undefined;

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label>Rarity:</Form.Label>
        <Form.Select
          name="rarity"
          onChange={handleSelectChange}
          value={values.rarity}
        >
          <option value="any">Any</option>
          {Object.values(ItemRarity).map((rarity) => (
            <option key={rarity} value={rarity}>
              {rarity}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group>
        <Form.Label>Frame Type:</Form.Label>
        <Form.Select
          name="frameType"
          onChange={handleSelectChange}
          value={values.frameType}
        >
          <option value="any">Any</option>
          {Object.entries(ItemFrameTypeNames).map(([key, val]) => (
            <option key={key} value={key}>
              {val}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group>
        <Form.Label>Item Type:</Form.Label>
        <Form.Select
          name="itemType"
          onChange={handleSelectChange}
          value={values.itemType}
        >
          <option value="any">Any</option>
          {Object.entries(ItemTypes).map(([, key]) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group className="my-4">
        {values.queries.map((query, index) => (
          <FilterQueryRow
            key={query.id}
            query={query}
            isFirst={index === 0}
            canRemove={values.queries.length > 1}
            error={queryErrors?.[index]?.value}
            onValueChange={handleValueChange}
            onModeChange={handleModeChange}
            onRemove={handleRemove}
            onKeyDown={handleKeyDown}
          />
        ))}
        <Button variant="success" size="sm" onClick={handleAddQuery}>
          <FontAwesomeIcon icon={faPlusCircle} /> Add Query
        </Button>
      </Form.Group>
      <Form.Group>
        <Button className="mb-4" type="submit">
          <FontAwesomeIcon icon={faMagnifyingGlass} /> Search
        </Button>
      </Form.Group>
    </Form>
  );
}
