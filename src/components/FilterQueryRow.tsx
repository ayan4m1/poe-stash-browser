import { ChangeEvent, KeyboardEvent } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmarkCircle } from '@fortawesome/free-solid-svg-icons';

import { BooleanMode, FilterQuery } from '../types';

interface FilterQueryRowProps {
  query: FilterQuery;
  isFirst: boolean;
  canRemove: boolean;
  error?: string;
  onValueChange: (id: string, value: string) => void;
  onModeChange: (id: string, mode: BooleanMode) => void;
  onRemove: (id: string) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export default function FilterQueryRow({
  query,
  isFirst,
  canRemove,
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
          value={query.mode}
          onChange={handleModeChange}
          style={{ maxWidth: '90px' }}
        >
          <option value="and">AND</option>
          <option value="or">OR</option>
          <option value="not">NOT</option>
        </Form.Select>
      )}
      <Form.Control
        type="text"
        value={query.value}
        onChange={handleValueChange}
        onKeyDown={onKeyDown}
        isInvalid={!!error}
        placeholder={isFirst ? 'Query' : 'Additional query'}
      />
      {canRemove && (
        <Button variant="outline-danger" onClick={() => onRemove(query.id)}>
          <FontAwesomeIcon icon={faXmarkCircle} />
        </Button>
      )}
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </InputGroup>
  );
}
