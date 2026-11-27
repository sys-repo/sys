import type { t } from './common.ts';
import { ValueContent } from './ui.Value.Content.tsx';
import { useDisclosure } from './use.Disclosure.ts';

/**
 * Render event history inside a row supplied by the host.
 */
export function Value<E extends t.EventWithKind>(props: t.EventsView.ValueProps<E>) {
  const panel = useDisclosure(props);
  return <ValueContent {...props} panel={panel} />;
}
