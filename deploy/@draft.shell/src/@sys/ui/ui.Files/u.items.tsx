import { D, Err, Is, type t } from './common.ts';
import { StatusTitle } from './ui.StatusTitle.tsx';
import { formatCapabilities } from './u.items.Capabilities.tsx';

type Input = Pick<t.FileInfoPanel.Props, 'fields' | 'theme' | 'title' | 'snapshot'>;

/**
 * Convert a Files client snapshot into KeyValue rows.
 */
export function toItems(input: Input): t.KeyValue.Item[] {
  const fields = resolveFields(input.fields);
  const snapshot = input.snapshot;
  const items: t.KeyValue.Item[] = [
    { kind: 'title', v: title(input, fields) },
  ];

  fields.forEach((field) => {
    if (field === 'status') items.push({ k: 'status', v: snapshot?.status ?? '-', mono: true });
    if (field === 'fidelity' && !Is.nil(snapshot?.capabilities?.fidelity)) {
      items.push({ k: 'fidelity', v: snapshot.capabilities.fidelity, mono: true });
    }
    if (field === 'capabilities' && !Is.nil(snapshot?.capabilities)) {
      items.push({ k: 'capabilities', v: formatCapabilities(snapshot.capabilities), mono: true });
    }
    if (field === 'error' && !Is.nil(snapshot?.error)) {
      items.push({ k: 'error', v: Err.summary(snapshot.error), mono: true });
    }
  });

  return items;
}

/**
 * Helpers:
 */
function title(input: Input, fields: readonly t.FileInfoPanel.Field[]): t.KeyValue.Title['v'] {
  const label = input.title ?? D.title;
  if (!fields.includes('status:title')) return label;
  return [
    label,
    <StatusTitle status={input.snapshot?.status} theme={input.theme} />,
  ];
}

function resolveFields(
  input: readonly t.FileInfoPanel.Field[] | undefined,
): t.FileInfoPanel.Field[] {
  const fields = input ?? D.fields;
  const seen = new Set<t.FileInfoPanel.Field>();
  const result: t.FileInfoPanel.Field[] = [];

  fields.forEach((field) => {
    if (seen.has(field)) return;
    seen.add(field);
    result.push(field);
  });

  return result;
}
