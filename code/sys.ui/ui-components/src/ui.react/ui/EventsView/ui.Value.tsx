import { D, type t } from './common.ts';
import { ValueContent } from './ui.Value.Content.tsx';
import { useDisclosure } from './use.Disclosure.ts';

/**
 * Render event history inside a row supplied by the host.
 */
export function Value<E extends t.EventWithKind>(props: t.EventsView.ValueProps<E>) {
  const disclosure = useDisclosure((props.mode ?? D.mode) === 'count' && props.items.length > 0);
  return <ValueContent {...props} disclosure={disclosure} />;
}
