import { Button, D, Is, KeyValue, type t } from './common.ts';
import { ErrorMessage } from './ui.ErrorMessage.tsx';
import { StatusTitle } from './ui.StatusTitle.tsx';
import { formatCapabilities } from './u.items.Capabilities.tsx';

type Input = Pick<
  t.Files.InfoPanel.Props,
  'events' | 'fields' | 'theme' | 'title' | 'snapshot' | 'transport'
>;

/**
 * Convert a Files client snapshot into KeyValue rows.
 */
export function toItems(input: Input): t.KeyValue.Item[] {
  const theme = input.theme;
  const fields = resolveFields(input.fields);
  const snapshot = input.snapshot;
  const items: t.KeyValue.Item[] = [{ id: 'title', kind: 'title', v: title(input, fields) }];

  fields.forEach((field) => {
    if (field === 'status') {
      items.push({ id: 'status', k: 'status', v: snapshot?.status ?? '-', mono: true });
    }
    if (field === 'transport' && canShowTransport(input)) {
      items.push({
        id: 'transport',
        kind: 'row',
        k: 'transport',
        v: transportButton(input, theme),
      });
    }
    if (field === 'fidelity' && !Is.nil(snapshot?.capabilities?.fidelity)) {
      items.push({ id: 'fidelity', k: 'fidelity', v: snapshot.capabilities.fidelity, mono: true });
    }
    if (field === 'capabilities' && !Is.nil(snapshot?.capabilities)) {
      items.push({
        id: 'capabilities',
        k: 'capabilities',
        v: formatCapabilities(snapshot.capabilities),
        mono: true,
      });
    }
    if (field === 'error' && snapshot?.status === 'error' && !Is.nil(snapshot.error)) {
      items.push({
        id: 'error',
        k: 'error',
        v: <ErrorMessage value={snapshot.error} theme={theme} />,
        mono: true,
      });
    }
    if (field === 'events' && canShowEvents(snapshot)) {
      const enabled = input.events?.enabled;
      items.push(
        KeyValue.Switches.toItem(
          {
            id: 'events',
            value: enabled,
            tooltip: enabled ? 'events on' : 'events off',
            onToggle: input.events?.onToggle,
          },
          { theme },
        ),
      );
    }
  });

  return items;
}

/**
 * Helpers:
 */
function title(input: Input, fields: readonly t.Files.InfoPanel.Field[]): t.KeyValue.Title['v'] {
  const label = input.title ?? D.title;
  if (!fields.includes('status:title')) return label;
  return [
    label,
    <StatusTitle status={input.snapshot?.status} theme={input.theme} />,
  ];
}

function transportButton(input: Input, theme?: t.CommonTheme) {
  const ready = input.snapshot?.status === 'ready';
  const label = ready ? 'disconnect' : 'connect';
  const action = ready ? input.transport?.onDisconnect : input.transport?.onConnect;

  return <Button theme={theme} label={label} enabled={!!action} onClick={() => action?.()} />;
}

function canShowTransport(input: Input): boolean {
  const transport = input.transport;
  return !!(transport?.onConnect || transport?.onDisconnect);
}

function canShowEvents(snapshot?: t.Files.InfoPanel.Snapshot): boolean {
  return snapshot?.status === 'ready' && snapshot.capabilities?.watch === true;
}

function resolveFields(
  input: readonly t.Files.InfoPanel.Field[] | undefined,
): t.Files.InfoPanel.Field[] {
  const fields = input ?? D.fields;
  const seen = new Set<t.Files.InfoPanel.Field>();
  const result: t.Files.InfoPanel.Field[] = [];

  fields.forEach((field) => {
    if (seen.has(field)) return;
    seen.add(field);
    result.push(field);
  });

  return result;
}
