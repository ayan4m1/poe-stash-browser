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
      if (value === enabled || !active) {
        // if current value and active differ, toggle value
        onChange(true, !value);
      } else {
        // toggle enabled if value and active are the same
        onChange(false);
      }
    },
    [onChange, active, enabled]
  );

  return (
    <ButtonGroup>
      <Button
        onClick={() => handleChange(true)}
        variant={active || !enabled ? 'outline-success' : 'success'}
      >
        Yes
      </Button>
      <Button
        onClick={() => handleChange(false)}
        variant={active && enabled ? 'danger' : 'outline-danger'}
      >
        No
      </Button>
    </ButtonGroup>
  );
}
