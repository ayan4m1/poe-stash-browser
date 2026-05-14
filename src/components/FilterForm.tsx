import { useFormik } from 'formik';
import {
  Button,
  ButtonGroup,
  Col,
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
import {
  influenceOptions,
  itemFrameTypeNames,
  socketColorStyles
} from '../utils';
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
        [SocketColor.Abyss]: undefined,
        [SocketColor.Any]: undefined
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
        <Col sm={6} xs={12}>
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
                max={100}
                min={1}
                name="minItemLevel"
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                type="number"
                value={values.minItemLevel ?? ''}
              />
              <InputGroup.Text>Max</InputGroup.Text>
              <Form.Control
                max={100}
                min={1}
                name="maxItemLevel"
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                type="number"
                value={values.maxItemLevel ?? ''}
              />
            </InputGroup>
          </Form.Group>
          <Form.Group>
            <Form.Label>Stack Size:</Form.Label>
            <InputGroup>
              <InputGroup.Text>Min</InputGroup.Text>
              <Form.Control
                min={1}
                name="minStackSize"
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                type="number"
                value={values.minStackSize ?? ''}
              />
              <InputGroup.Text>Max</InputGroup.Text>
              <Form.Control
                min={1}
                name="maxStackSize"
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                type="number"
                value={values.maxStackSize ?? ''}
              />
            </InputGroup>
          </Form.Group>
          <Form.Group>
            <Form.Label>Minimum Sockets:</Form.Label>
            <InputGroup>
              <InputGroup.Text>Any Color</InputGroup.Text>
              <Form.Control
                max={6}
                min={0}
                name="minSockets.*"
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                type="number"
                value={values.minSockets?.[SocketColor.Any]}
              />
            </InputGroup>
            <InputGroup>
              {Object.values(SocketColor)
                .filter((val) => val !== SocketColor.Any)
                .map((color) => (
                  <Fragment key={color}>
                    <InputGroup.Text style={socketColorStyles[color]}>
                      {color}
                    </InputGroup.Text>
                    <Form.Control
                      max={6}
                      min={0}
                      name={`minSockets.${color}`}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      type="number"
                      value={values.minSockets?.[color] ?? ''}
                    />
                  </Fragment>
                ))}
            </InputGroup>
          </Form.Group>
          <Form.Group>
            <Form.Label>Minimum Links:</Form.Label>
            <Form.Control
              min={1}
              name="minLinks"
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              type="number"
              value={values.minLinks ?? ''}
            />
          </Form.Group>
          <Form.Group className="mt-2">
            <Form.Label>Item Flags:</Form.Label>
            <Row>
              {booleanFlags.map(({ label, field }) => {
                const current = values[field] as boolean | undefined;
                return (
                  <Col className="mb-1" key={field} xs={6}>
                    <Row>
                      <Col className="d-flex align-items-center" xs={4}>
                        <span className="me-2" style={{ fontSize: '0.85em' }}>
                          {label}:
                        </span>
                      </Col>
                      <Col className="d-flex justify-content-center" xs={8}>
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
                <Col className="mb-1" key={influence} xs={6}>
                  <Form.Check
                    checked={values.influences?.includes(influence) ?? false}
                    label={
                      influence.charAt(0).toUpperCase() + influence.slice(1)
                    }
                    onChange={(e) =>
                      handleInfluenceChange(influence, e.target.checked)
                    }
                    type="checkbox"
                  />
                </Col>
              ))}
            </Row>
          </Form.Group>
        </Col>
        <Col className="d-flex" sm={6} style={{ flexWrap: 'wrap' }} xs={12}>
          <Form.Group style={{ flexBasis: '100%' }}>
            <Form.Label>Queries:</Form.Label>
            {values.queries.map((query, index) =>
              query.type === 'range' ? (
                <FilterRangeQueryRow
                  error={queryErrors?.[index]?.value}
                  isFirst={index === 0}
                  key={query.id}
                  onKeyDown={handleKeyDown}
                  onModeChange={handleModeChange}
                  onNumberValueChange={handleNumberValueChange}
                  onOperatorChange={handleOperatorChange}
                  onRemove={handleRemove}
                  onValueChange={handleValueChange}
                  query={query}
                />
              ) : (
                <FilterQueryRow
                  error={queryErrors?.[index]?.value}
                  isFirst={index === 0}
                  key={query.id}
                  onKeyDown={handleKeyDown}
                  onModeChange={handleModeChange}
                  onRemove={handleRemove}
                  onValueChange={handleValueChange}
                  query={query}
                />
              )
            )}
          </Form.Group>
          <Form.Group
            className="align-self-start text-end"
            style={{ flexBasis: '100%' }}
          >
            <Button onClick={handleAddQuery} size="sm" variant="success">
              <FontAwesomeIcon icon={faPlusCircle} /> Add Query
            </Button>{' '}
            <Button onClick={handleAddRangeQuery} size="sm" variant="info">
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
                onClick={handleReset}
                type="button"
                variant="secondary"
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
