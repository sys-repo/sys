import { D, Err, FilesBase, Is, type t } from './common.ts';

type Input = Pick<t.FileInfoPanel.Props, 'title' | 'snapshot'>;

/**
 * Convert a Files client snapshot into KeyValue rows.
 */
export function toItems(input: Input): t.KeyValue.Item[] {
  const snapshot = input.snapshot;
  const items: t.KeyValue.Item[] = [
    { kind: 'title', v: input.title ?? D.title },
    { k: 'status', v: snapshot?.status ?? '-', mono: true },
  ];

  if (!Is.nil(snapshot?.capabilities)) {
    if (!Is.nil(snapshot.capabilities.fidelity)) {
      items.push({ k: 'fidelity', v: snapshot.capabilities.fidelity, mono: true });
    }
    items.push({ k: 'capabilities', v: formatCapabilities(snapshot.capabilities), mono: true });
  }
  if (!Is.nil(snapshot?.error)) {
    items.push({ k: 'error', v: Err.summary(snapshot.error), mono: true });
  }

  return items;
}

/**
 * Helpers:
 */

function formatCapabilities(value: t.Files.Capabilities): t.ReactNode {
  const enabled = FilesBase.Capability.names.filter((name) => value[name]);
  return enabled.length > 0 ? enabled.join(' ') : 'none';
}
