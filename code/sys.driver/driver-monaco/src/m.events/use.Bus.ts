import { useRef } from 'react';

import { type t } from './common.ts';
import { Bus } from './m.Bus.ts';

/**
 * Common useRef for a bus$ subject.
 */
export function useBus(input?: t.EditorEventBus) {
  const busRef = useRef<t.EditorEventBus>(input ?? Bus.make());
  const bus$ = busRef.current;
  return bus$;
}
