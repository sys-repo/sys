import { KeyValue } from '../KeyValue/mod.ts';
import { D, type t } from './common.ts';
import { EventsLabel } from './ui.Label.Events.tsx';
import { ValueContent } from './ui.Value.Content.tsx';
import { EmptyValue } from './ui.Value.Empty.tsx';
import { Value } from './ui.Value.tsx';
import { useDisclosure } from './use.Disclosure.ts';

export function EventsView<E extends t.EventWithKind>(props: t.EventsView.Props<E>) {
  const { items, mode = D.mode, mono, debug, theme, style } = props;
  const disclosure = useDisclosure(mode === 'count' && items.length > 0);
  return (
    <KeyValue.UI
      items={toRows(props, disclosure)}
      layout={{ kind: 'table' }}
      mono={mono}
      debug={debug}
      theme={theme}
      style={style}
    />
  );
}

function toRows<E extends t.EventWithKind>(
  props: t.EventsView.Props<E>,
  disclosure: t.Disclosure,
): t.KeyValue.Item.Row[] {
  const { items, renderItem, labels, theme, mode = D.mode, tail } = props;
  const latest = items.at(-1);

  return [
    {
      k: labels?.latest ?? 'latest event',
      v: !latest
        ? <EmptyValue />
        : renderItem
        ? <Value items={[latest]} mode='list' renderItem={renderItem} />
        : latest.kind,
    },
    {
      k: labels?.events ?? (
        <EventsLabel
          count={items.length}
          tail={tail}
          theme={theme}
          toggle={mode === 'count' ? disclosure : undefined}
        />
      ),
      v: <ValueContent {...{ items, mode, tail, renderItem, theme, disclosure }} />,
    },
  ];
}
