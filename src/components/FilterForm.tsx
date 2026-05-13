import { useFormik } from 'formik';
import {
  Button,
  ButtonGroup,
  Col,
  Container,
  Form,
  InputGroup,
  Row
} from 'react-bootstrap';
import {
  ChangeEvent,
  Fragment,
  KeyboardEvent,
  useCallback,
  useMemo
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faPlusCircle,
  faRotateLeft
} from '@fortawesome/free-solid-svg-icons';

import FilterQueryRow from './FilterQueryRow';
import FilterRangeQueryRow from './FilterRangeQueryRow';
import {
  BooleanMode,
  FilterForm as FilterFormType,
  FilterQueryType,
  ItemRarity,
  ItemType as ItemTypes,
  MinSocketColors,
  RangeOperator,
  SocketColor
} from '../types';
import { itemFrameTypeNames, socketColorStyles } from '../utils';
import SplitButton from './SplitButton';

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
  const booleanFlags: { label: string; field: keyof FilterFormType }[] = [
    { label: 'Corrupted', field: 'corrupted' },
    { label: 'Identified', field: 'identified' },
    { label: 'Veiled', field: 'veiled' },
    { label: 'Synthesised', field: 'synthesised' },
    { label: 'Fractured', field: 'fractured' },
    { label: 'Replica', field: 'replica' },
    { label: 'Mirrored', field: 'mirrored' }
  ];

  const influenceOptions = [
    'elder',
    'shaper',
    'searing',
    'tangled',
    'crusader',
    'redeemer',
    'hunter',
    'warlord'
  ];

  const initialValues = useMemo<FilterFormType>(
    () => ({
      rarity: undefined,
      itemType: undefined,
      frameType: undefined,
      minSockets: {
        [SocketColor.Red]: undefined,
        [SocketColor.Green]: undefined,
        [SocketColor.Blue]: undefined,
        [SocketColor.White]: undefined,
        [SocketColor.Abyss]: undefined
      } as MinSocketColors,
      minLinks: undefined,
      minItemLevel: undefined,
      maxItemLevel: undefined,
      minStackSize: undefined,
      maxStackSize: undefined,
      corrupted: undefined,
      identified: undefined,
      veiled: undefined,
      synthesised: undefined,
      fractured: undefined,
      replica: undefined,
      mirrored: undefined,
      influences: [],
      queries: [{ id: crypto.randomUUID(), value: '' }]
    }),
    []
  );

  const {
    values,
    errors,
    handleChange,
    handleSubmit,
    setFieldValue,
    resetForm
  } = useFormik<FilterFormType>({
    initialValues,
    validate,
    onSubmit
  });

  const handleReset = useCallback(() => {
    resetForm();
    onSubmit({
      ...initialValues,
      queries: [{ id: crypto.randomUUID(), value: '' }]
    });
  }, [resetForm, onSubmit, initialValues]);

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

  const handleFlagChange = useCallback(
    (field: keyof FilterFormType) => (checked: boolean, value?: boolean) => {
      const current = values[field] as boolean | undefined;
      setFieldValue(field, current === value && checked ? undefined : value);
    },
    [values, setFieldValue]
  );

  const handleInfluenceChange = useCallback(
    (influence: string, checked: boolean) => {
      const current = values.influences ?? [];
      setFieldValue(
        'influences',
        checked
          ? [...current, influence]
          : current.filter((i) => i !== influence)
      );
    },
    [values.influences, setFieldValue]
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
              {Object.entries(itemFrameTypeNames).map(([key, val]) => (
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
            <Form.Label>Item Level:</Form.Label>
            <InputGroup>
              <InputGroup.Text>Min</InputGroup.Text>
              <Form.Control
                type="number"
                name="minItemLevel"
                min={1}
                max={100}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                value={values.minItemLevel ?? ''}
              />
              <InputGroup.Text>Max</InputGroup.Text>
              <Form.Control
                type="number"
                name="maxItemLevel"
                min={1}
                max={100}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                value={values.maxItemLevel ?? ''}
              />
            </InputGroup>
          </Form.Group>
          <Form.Group>
            <Form.Label>Stack Size:</Form.Label>
            <InputGroup>
              <InputGroup.Text>Min</InputGroup.Text>
              <Form.Control
                type="number"
                name="minStackSize"
                min={1}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                value={values.minStackSize ?? ''}
              />
              <InputGroup.Text>Max</InputGroup.Text>
              <Form.Control
                type="number"
                name="maxStackSize"
                min={1}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                value={values.maxStackSize ?? ''}
              />
            </InputGroup>
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
          <Form.Group className="mt-2">
            <Form.Label>Item Flags:</Form.Label>
            <Row>
              {booleanFlags.map(({ label, field }) => {
                const current = values[field] as boolean | undefined;
                return (
                  <Col xs={6} key={field} className="mb-1">
                    <Row>
                      <Col xs={12} sm={4} className="d-flex align-items-center">
                        <span className="me-2" style={{ fontSize: '0.85em' }}>
                          {label}:
                        </span>
                      </Col>
                      <Col
                        xs={12}
                        sm={8}
                        className="d-flex justify-content-center"
                      >
                        <SplitButton
                          active={current !== undefined}
                          enabled={current === true}
                          onChange={handleFlagChange(field)}
                        />
                      </Col>
                    </Row>
                  </Col>
                );
              })}
            </Row>
          </Form.Group>
          <Form.Group className="mt-2">
            <Form.Label>Influences:</Form.Label>
            <Row>
              {influenceOptions.map((influence) => (
                <Col xs={6} key={influence} className="mb-1">
                  <Form.Check
                    type="checkbox"
                    label={
                      influence.charAt(0).toUpperCase() + influence.slice(1)
                    }
                    checked={values.influences?.includes(influence) ?? false}
                    onChange={(e) =>
                      handleInfluenceChange(influence, e.target.checked)
                    }
                  />
                </Col>
              ))}
            </Row>
          </Form.Group>
        </Col>
        <Col xs={12} sm={6} className="d-flex" style={{ flexWrap: 'wrap' }}>
          <Form.Group style={{ flexBasis: '100%' }}>
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
          <Form.Group
            className="align-self-start text-end"
            style={{ flexBasis: '100%' }}
          >
            <Button variant="success" size="sm" onClick={handleAddQuery}>
              <FontAwesomeIcon icon={faPlusCircle} /> Add Query
            </Button>{' '}
            <Button variant="info" size="sm" onClick={handleAddRangeQuery}>
              <FontAwesomeIcon icon={faPlusCircle} /> Add Range Query
            </Button>
          </Form.Group>
          <Form.Group
            className="mt-4 align-self-end text-end"
            style={{ flexBasis: '100%' }}
          >
            <ButtonGroup>
              <Button
                className="mb-4 me-2"
                variant="secondary"
                type="button"
                onClick={handleReset}
              >
                <FontAwesomeIcon icon={faRotateLeft} /> Clear
              </Button>
              <Button className="mb-4" type="submit">
                <FontAwesomeIcon icon={faMagnifyingGlass} /> Search
              </Button>
            </ButtonGroup>
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
}
