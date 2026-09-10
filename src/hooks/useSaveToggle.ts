import { useCallback } from 'react';

import useAppContext from './useAppContext';
import { Item } from '../types';

export default function useSaveToggle(item: Item, saved?: boolean) {
  const { setSavedItems } = useAppContext();

  return useCallback(() => {
    if (saved) {
      setSavedItems((prev) => {
        const result = [...prev];

        result.splice(
          result.findIndex((itemId) => item.id === itemId),
          1
        );

        return result;
      });
    } else {
      setSavedItems((prev) => [...prev, item.id]);
    }
  }, [item, saved, setSavedItems]);
}
