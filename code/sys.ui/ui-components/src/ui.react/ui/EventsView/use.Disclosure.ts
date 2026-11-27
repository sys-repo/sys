import { useEffect, useId, useState } from 'react';
import type { t } from './common.ts';

export function useDisclosure(enabled: boolean): t.Disclosure {
  const controls = useId();
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!enabled) setExpanded(false);
  }, [enabled]);
  return { expanded, controls, onToggle: () => setExpanded((prev) => !prev) };
}
