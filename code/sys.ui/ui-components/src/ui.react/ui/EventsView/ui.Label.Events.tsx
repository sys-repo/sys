import { Anchor } from '../Anchor/mod.ts';
import type { t } from './common.ts';
import { shownCount } from './u.ts';

type Props = {
  readonly count: number;
  readonly tail?: number;
  readonly theme?: t.CommonTheme;
  readonly toggle?: t.Disclosure;
};

/** Offer the default label as a toggle only when there are event rows to reveal. */
export function EventsLabel({ count, tail, theme, toggle }: Props) {
  const label = 'events';
  if (!toggle || shownCount(count, tail) === 0) return label;
  return (
    <Anchor.Button
      theme={theme}
      onClick={toggle.onToggle}
      aria-expanded={toggle.expanded}
      aria-controls={toggle.controls}
    >
      {label}
    </Anchor.Button>
  );
}
