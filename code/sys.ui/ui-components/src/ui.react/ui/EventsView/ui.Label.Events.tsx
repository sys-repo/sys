import { Anchor } from '../Anchor/mod.ts';
import type { t } from './common.ts';

type Props = {
  readonly theme?: t.CommonTheme;
  readonly panel?: t.Panel;
};

/** Offer the default label as a toggle only when there are event rows to reveal. */
export function EventsLabel({ theme, panel }: Props) {
  const label = 'events';
  if (!panel) return label;
  return (
    <Anchor.Button
      theme={theme}
      onClick={panel.onToggle}
      aria-expanded={panel.expanded}
      aria-controls={panel.controls}
    >
      {label}
    </Anchor.Button>
  );
}
