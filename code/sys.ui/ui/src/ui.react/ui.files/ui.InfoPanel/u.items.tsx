import { D, Is, KeyValue, type t } from './common.ts';
import { ErrorMessage } from './ui.ErrorMessage.tsx';
import { StatusTitle } from './ui.StatusTitle.tsx';
import { formatCapabilities } from './u.items.Capabilities.tsx';

type Input = Pick<t.Files.InfoPanel.Props, 'events' | 'fields' | 'theme' | 'title' | 'snapshot'>;

/**
 * Convert a Files client snapshot into KeyValue rows.
 */
export function toItems(input: Input): t.KeyValue.Item[] {
  const theme = input.theme;
  const fields = resolveFields(input.fields);
  const snapshot = input.snapshot;
  const items: t.KeyValue.Item[] = [{ kind: 'title', v: title(input, fields) }];

  fields.forEach((field) => {
    if (field === 'status') items.push({ k: 'status', v: snapshot?.status ?? '-', mono: true });
    if (field === 'fidelity' && !Is.nil(snapshot?.capabilities?.fidelity)) {
      items.push({ k: 'fidelity', v: snapshot.capabilities.fidelity, mono: true });
    }
    if (field === 'capabilities' && !Is.nil(snapshot?.capabilities)) {
      items.push({ k: 'capabilities', v: formatCapabilities(snapshot.capabilities), mono: true });
    }
    if (field === 'error' && snapshot?.status === 'error' && !Is.nil(snapshot.error)) {
      items.push({
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
