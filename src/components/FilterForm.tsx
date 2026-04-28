import { useFormik } from 'formik';
import { Button, Col, Form, InputGroup, Row } from 'react-bootstrap';
import { ChangeEvent, Fragment, KeyboardEvent, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faPlusCircle
} from '@fortawesome/free-solid-svg-icons';

import FilterQueryRow from './FilterQueryRow';
import FilterRangeQueryRow from './FilterRangeQueryRow';
import {
  BooleanMode,
  FilterForm as FilterFormType,
  FilterQueryType,
  ItemFrameTypeNames,
  ItemRarity,
  ItemType as ItemTypes,
  MinSocketColors,
  RangeOperator,
  SocketColor,
  socketColorStyles
} from '../types';

interface FilterFormProps {
  onFilter: (values: FilterFormType) => void;
}

const validate = (values: FilterFormType) => {
  const errors: { queries?: Array<Record<string, string>> } = {};
  const queryErrors: Array<Record<string, string>> = [];
  let hasError = false;

  for (const q of values.queries) {
    const qError: Record<string, string> = {};
    if (q.value.trim() !== '') {
      try {
        new RegExp(q.value);
      } catch {
        qError.value = 'Invalid regex pattern';
        hasError = true;
      }
    }
    if (q.type === 'range') {
      if (q.numberValue !== undefined && !isFinite(q.numberValue)) {
        qError.numberValue = 'Invalid number';
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

export default function FilterForm({ onFilter: onSubmit }: FilterFormProps) {
  const { values, errors, handleChange, handleSubmit, setFieldValue } =
    useFormik<FilterFormType>({
      initialValues: {
        rarity: undefined,
        itemType: undefined,
        frameType: undefined,
        minSockets: {
          [SocketColor.Red]: undefined,
          [SocketColor.Green]: undefined,
          [SocketColor.Blue]: undefined,
          [SocketColor.White]: undefined
        } as MinSocketColors,
        minLinks: undefined,
        queries: [{ id: crypto.randomUUID(), value: '' }]
      },
      validate,
      onSubmit
    });

  const handleAddQuery = useCallback(() => {
    setFieldValue('queries', [
      ...values.queries,
      { id: crypto.randomUUID(), value: '', mode: 'and' as BooleanMode }
    ]);
  }, [values.queries, setFieldValue]);

  const handleAddRangeQuery = useCallback(() => {
    setFieldValue('queries', [
      ...values.queries,
      {
        id: crypto.randomUUID(),
        type: 'range' as FilterQueryType,
        value: '',
        operator: '>' as RangeOperator,
        numberValue: 0,
        mode: 'and' as BooleanMode
      }
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

  const handleOperatorChange = useCallback(
    (id: string, operator: RangeOperator) => {
      const index = values.queries.findIndex((q) => q.id === id);
      if (index >= 0) {
        setFieldValue(`queries.${index}.operator`, operator);
      }
    },
    [values.queries, setFieldValue]
  );

  const handleNumberValueChange = useCallback(
    (id: string, value: number) => {
      const index = values.queries.findIndex((q) => q.id === id);
      if (index >= 0) {
        setFieldValue(`queries.${index}.numberValue`, value);
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

  const queryErrors = errors?.queries as
    | Array<Record<string, string>>
    | undefined;

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col xs={12} sm={6}>
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
          <Form.Group>
            <Form.Label>Base Type:</Form.Label>
            <Form.Control
              name="baseType"
              onChange={handleChange}
              type="text"
              value={values.baseType}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Minimum Sockets:</Form.Label>
            <InputGroup>
              {Object.values(SocketColor).map((color) => (
                <Fragment key={color}>
                  <InputGroup.Text style={socketColorStyles[color]}>
                    {color}
                  </InputGroup.Text>
                  <Form.Control
                    type="number"
                    name={`minSockets.${color}`}
                    min={0}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    value={values.minSockets?.[color] ?? ''}
                  />
                </Fragment>
              ))}
            </InputGroup>
          </Form.Group>
          <Form.Group>
            <Form.Label>Minimum Links:</Form.Label>
            <Form.Control
              type="number"
              name="minLinks"
              min={1}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              value={values.minLinks ?? ''}
            />
          </Form.Group>
        </Col>
        <Col xs={12} sm={6}>
          <Form.Group>
            <Form.Label>Queries:</Form.Label>
            {values.queries.map((query, index) =>
              query.type === 'range' ? (
                <FilterRangeQueryRow
                  key={query.id}
                  query={query}
                  isFirst={index === 0}
                  error={queryErrors?.[index]?.value}
                  onValueChange={handleValueChange}
                  onOperatorChange={handleOperatorChange}
                  onNumberValueChange={handleNumberValueChange}
                  onModeChange={handleModeChange}
                  onRemove={handleRemove}
                  onKeyDown={handleKeyDown}
                />
              ) : (
                <FilterQueryRow
                  key={query.id}
                  query={query}
                  isFirst={index === 0}
                  error={queryErrors?.[index]?.value}
                  onValueChange={handleValueChange}
                  onModeChange={handleModeChange}
                  onRemove={handleRemove}
                  onKeyDown={handleKeyDown}
                />
              )
            )}
          </Form.Group>
          <Form.Group className="my-4 text-end">
            <Button variant="success" size="sm" onClick={handleAddQuery}>
              <FontAwesomeIcon icon={faPlusCircle} /> Add Query
            </Button>{' '}
            <Button variant="info" size="sm" onClick={handleAddRangeQuery}>
              <FontAwesomeIcon icon={faPlusCircle} /> Add Range Query
            </Button>
          </Form.Group>
          <Form.Group className="text-end">
            <Button className="mb-4" type="submit">
              <FontAwesomeIcon icon={faMagnifyingGlass} /> Search
            </Button>
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
}
