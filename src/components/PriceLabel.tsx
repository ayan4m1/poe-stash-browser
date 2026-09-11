import { ItemValue } from '../types';
import { ItemValueReason } from '../hooks/useItemValue';

interface IProps {
  isError?: boolean;
  reason?: ItemValueReason;
  value?: ItemValue;
}

/**
 * What poe.ninja said, in the item's own words. Split from PriceButton so the
 * answer can stay with the item while the button that asks for it lives up with
 * the other controls.
 */
export default function PriceLabel({ isError, reason, value }: IProps) {
  // Never priceable, so there is nothing to say about it.
  if (reason === 'unsupported' || reason === 'no-league') {
    return null;
  }

  if (value && value.unitChaosValue >= 1) {
    return (
      <p className="text-end small">{Math.round(value.unitChaosValue)} Chaos</p>
    );
  } else if (value) {
    return <p className="text-end small">&lt;1 Chaos</p>;
  }

  if (isError || reason === 'unpriced') {
    return (
      <p className="text-end small text-muted">
        {isError ? 'No price data' : 'Unpriced'}
      </p>
    );
  }

  // Not asked for yet, or still in flight - the button speaks for both.
  return null;
}
