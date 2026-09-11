import { Button } from 'react-bootstrap';
import { faCoins, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ItemValue } from '../types';
import { ItemValueReason } from '../hooks/useItemValue';

interface IProps {
  isError?: boolean;
  isPending?: boolean;
  onPriceClick: () => void;
  reason?: ItemValueReason;
  value?: ItemValue;
}

/**
 * Asks poe.ninja what one item is worth. Rendered per item because each press
 * is what spends a request - see useItemValue, which holds the gate. The answer
 * itself lands in PriceLabel, so this renders nothing once there is one.
 */
export default function PriceButton({
  isError,
  isPending,
  onPriceClick,
  reason,
  value
}: IProps) {
  // Nothing a press could fetch: poe.ninja has no category for this item, or
  // there is no league to price it in.
  if (reason === 'unsupported' || reason === 'no-league') {
    return null;
  }

  // The question has been answered - PriceLabel is showing it.
  if (value) {
    return null;
  }

  // Both outcomes are answers, not invitations - the overview is fetched and
  // either has no line for this item or could not be had at all. A button here
  // would be one the user can press to no effect.
  if (isError || reason === 'unpriced') {
    return null;
  }

  return (
    <Button disabled={isPending} onClick={onPriceClick}>
      <FontAwesomeIcon
        icon={isPending ? faSpinner : faCoins}
        spin={isPending}
      />
    </Button>
  );
}
