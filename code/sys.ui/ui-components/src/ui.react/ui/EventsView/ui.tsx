import { KeyValue } from '../KeyValue/mod.ts';
import { D, type t } from './common.ts';
import { EventsLabel } from './ui.Label.Events.tsx';
import { ValueContent } from './ui.Value.Content.tsx';
import { EmptyValue } from './ui.Value.Empty.tsx';
import { useDisclosure } from './use.Disclosure.ts';

export function EventsView<E extends t.EventWithKind>(props: t.EventsView.Props<E>) {
  const { items, mono, debug, theme, style } = props;
  const panel = useDisclosure(props);
  return (
    <KeyValue.UI
      items={toRows(props, panel)}
      layout={{ kind: 'table' }}
      mono={mono && items.length > 0}
      debug={debug}
      theme={theme}
      style={style}
    />
  );
}

function toRows<E extends t.EventWithKind>(
  props: t.EventsView.Props<E>,
  panel?: t.Panel,
): t.KeyValue.Item.Row[] {
  const { items, renderItem, labels, theme, mode = D.mode, tail } = props;
  const latest = items.at(-1);

  return [
    {
      k: labels?.latest ?? 'latest event',
      v: !latest
        ? <EmptyValue />
        : renderItem
        ? <ValueContent items={[latest]} mode='list' renderItem={renderItem} />
        : latest.kind,
    },
    {
      k: labels?.events ?? <EventsLabel theme={theme} panel={panel} />,
      v: <ValueContent {...{ items, mode, tail, renderItem, theme, panel }} />,
    },
  ];
}
