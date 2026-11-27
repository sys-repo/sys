import { useId, useState } from 'react';
import { D, type t } from './common.ts';
import { shownCount } from './u.ts';

type Props = Pick<t.EventsView.ValueProps, 'items' | 'mode' | 'tail' | 'disclosure'>;

/** Reset only local expansion when its lifetime ends; keep the rendered frame mounted. */
export function useDisclosure(props: Props): t.Panel | undefined {
  const { items, mode = D.mode, tail, disclosure } = props;
  const controls = useId();
  const [localOpen, setLocalOpen] = useState(false);
  const countMode = mode === 'count' && items.length > 0;
  if (localOpen && (!countMode || disclosure)) setLocalOpen(false);
  if (!countMode || shownCount(items.length, tail) === 0) return undefined;

  const expanded = disclosure?.expanded ?? localOpen;
  const onToggle = disclosure
    ? () => disclosure.onToggle(!expanded)
    : () => setLocalOpen((prev) => !prev);
  return { controls, expanded, onToggle };
}
