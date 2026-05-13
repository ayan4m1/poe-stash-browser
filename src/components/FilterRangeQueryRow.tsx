import { ChangeEvent, KeyboardEvent } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmarkCircle } from '@fortawesome/free-solid-svg-icons';

import { BooleanMode, FilterQuery, RangeOperator } from '../types';

interface FilterRangeQueryRowProps {
  query: FilterQuery;
  isFirst: boolean;
  error?: string;
  onValueChange: (id: string, value: string) => void;
  onOperatorChange: (id: string, operator: RangeOperator) => void;
  onNumberValueChange: (id: string, value: number) => void;
  onModeChange: (id: string, mode: BooleanMode) => void;
  onRemove: (id: string) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export default function FilterRangeQueryRow({
  query,
  isFirst,
  error,
  onValueChange,
  onOperatorChange,
  onNumberValueChange,
  onModeChange,
  onRemove,
  onKeyDown
}: FilterRangeQueryRowProps) {
  const handleValueChange = (e: ChangeEvent<HTMLInputElement>) =>
    onValueChange(query.id, e.target.value);

  const handleOperatorChange = (e: ChangeEvent<HTMLSelectElement>) =>
    onOperatorChange(query.id, e.target.value as RangeOperator);

  const handleNumberValueChange = (e: ChangeEvent<HTMLInputElement>) =>
    onNumberValueChange(query.id, parseFloat(e.target.value) || 0);

  const handleModeChange = (e: ChangeEvent<HTMLSelectElement>) =>
    onModeChange(query.id, e.target.value as BooleanMode);

  return (
    <InputGroup className="mb-2">
      {!isFirst && (
        <Form.Select
          onChange={handleModeChange}
          style={{ maxWidth: '100px' }}
          value={query.mode}
        >
          <option value="and">AND</option>
          <option value="or">OR</option>
          <option value="not">NOT</option>
        </Form.Select>
      )}
      <Form.Control
        isInvalid={!!error}
        onChange={handleValueChange}
        onKeyDown={onKeyDown}
        placeholder={isFirst ? 'Property name' : 'Additional range query'}
        type="text"
        value={query.value}
      />
      <Form.Select
        onChange={handleOperatorChange}
        style={{ maxWidth: '80px' }}
        value={query.operator}
      >
        <option value="<">{'<'}</option>
        <option value="<=">{'<='}</option>
        <option value=">">{'>'}</option>
        <option value=">=">{'>='}</option>
        <option value="=">=</option>
      </Form.Select>
      <Form.Control
        onChange={handleNumberValueChange}
        onKeyDown={onKeyDown}
        style={{ maxWidth: '100px' }}
        type="number"
        value={query.numberValue ?? 0}
      />
      {!isFirst && (
        <Button onClick={() => onRemove(query.id)} variant="outline-danger">
          <FontAwesomeIcon icon={faXmarkCircle} />
        </Button>
      )}
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </InputGroup>
  );
}
