import { useEffect, useState } from 'react';

import { PHONE_QUERY } from '../styles/media';

export function useIsMobile(): boolean {
  const [match, setMatch] = useState(() => window.matchMedia(PHONE_QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia(PHONE_QUERY);

    const onChange = () => setMatch(media.matches);

    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
  }, []);

  return match;
}
