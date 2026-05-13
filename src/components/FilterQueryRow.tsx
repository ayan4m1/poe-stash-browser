import { ChangeEvent, KeyboardEvent } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmarkCircle } from '@fortawesome/free-solid-svg-icons';

import { BooleanMode, FilterQuery } from '../types';

interface FilterQueryRowProps {
  query: FilterQuery;
  isFirst: boolean;
  error?: string;
  onValueChange: (id: string, value: string) => void;
  onModeChange: (id: string, mode: BooleanMode) => void;
  onRemove: (id: string) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export default function FilterQueryRow({
  query,
  isFirst,
  error,
  onValueChange,
  onModeChange,
  onRemove,
  onKeyDown
}: FilterQueryRowProps) {
  const handleValueChange = (e: ChangeEvent<HTMLInputElement>) =>
    onValueChange(query.id, e.target.value);

  const handleModeChange = (e: ChangeEvent<HTMLSelectElement>) =>
    onModeChange(query.id, e.target.value as BooleanMode);

  return (
    <InputGroup className="mb-2">
      {!isFirst && (
        <Form.Select
          onChange={handleModeChange}
          style={{ maxWidth: '90px' }}
          value={query.mode}
        >
          <option value="and">AND</option>
          <option value="or">OR</option>
          <option value="not">NOT</option>
        </Form.Select>
      )}
      <Form.Control
        isInvalid={Boolean(error)}
        onChange={handleValueChange}
        onKeyDown={onKeyDown}
        placeholder={'Regular expression (e.g. move.*speed)'}
        type="text"
        value={query.value}
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
