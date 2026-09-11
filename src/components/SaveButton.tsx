import { Button } from 'react-bootstrap';
import { faRemove, faSave } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { Item } from '../types';
import { cannotSaveTypes } from '../utils';

interface IProps {
  item: Item;
  onSaveToggle: () => void;
  saved?: boolean;
}

export default function SaveButton({ item, onSaveToggle, saved }: IProps) {
  if (cannotSaveTypes.includes(item.frameTypeId)) {
    return null;
  }

  return (
    <Button onClick={onSaveToggle} variant={saved ? 'danger' : 'success'}>
      <FontAwesomeIcon icon={saved ? faRemove : faSave} />
    </Button>
  );
}
