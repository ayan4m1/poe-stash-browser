import { useCallback } from 'react';
import { Button, ButtonGroup } from 'react-bootstrap';

interface IProps {
  active: boolean;
  enabled: boolean;
  onChange: (checked: boolean, value?: boolean) => void;
}

export default function SplitButton({ active, enabled, onChange }: IProps) {
  const handleChange = useCallback(
    (value: boolean) => {
      if (active && value === enabled) {
        onChange(false);
      } else {
        onChange(true, value);
      }
    },
    [onChange, active, enabled]
  );

  return (
    <ButtonGroup>
      <Button
        onClick={() => handleChange(true)}
        variant={active && enabled ? 'success' : 'outline-success'}
      >
        Yes
      </Button>
      <Button
        onClick={() => handleChange(false)}
        variant={active && !enabled ? 'danger' : 'outline-danger'}
      >
        No
      </Button>
    </ButtonGroup>
  );
}
