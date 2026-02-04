import { useMemo } from 'react';
import {
  renderCensoredDescription,
  decodeHtmlEntities,
} from '../components/SteamDetective/utils';

export const useCensoredDescription = (shortDescription: string) => {
  return useMemo(() => {
    return renderCensoredDescription(decodeHtmlEntities(shortDescription));
  }, [shortDescription]);
};
