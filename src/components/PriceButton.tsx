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
 * Asks poe.ninja what one item is worth, then shows the answer in the button's
 * place. Rendered per item because each press is what spends a request - see
 * useItemValue, which holds the gate.
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

  if (value) {
    return <p className="text-end">{Math.round(value.unitChaosValue)} Chaos</p>;
  }

  // Both outcomes are answers, not invitations - the overview is fetched and
  // either has no line for this item or could not be had at all. A button here
  // would be one the user can press to no effect.
  if (isError || reason === 'unpriced') {
    return (
      <p className="text-end text-muted">
        {isError ? 'No price data' : 'Unpriced'}
      </p>
    );
  }

  return (
    <p className="text-end">
      <Button disabled={isPending} onClick={onPriceClick}>
        <FontAwesomeIcon
          icon={isPending ? faSpinner : faCoins}
          spin={isPending}
        />
      </Button>
    </p>
  );
}
