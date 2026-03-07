import type { t } from './common.ts';

type O = Record<string, unknown>;

export function normalizeEditorSequenceForTypedYaml(input: unknown): t.SequenceItem[] | undefined {
  if (!Array.isArray(input)) return undefined;
  return input.map((item) => normalizeSequenceItem(item)) as t.SequenceItem[];
}

function normalizeSequenceItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item;
  const anyItem = item as O;
  const clone: O = { ...anyItem };

  const timestamps = clone.timestamps as O | undefined;
  if (timestamps && typeof timestamps === 'object') {
    const nextTs: O = {};
    for (const [key, value] of Object.entries(timestamps)) nextTs[key] = normalizeTimestampEntry(value);
    clone.timestamps = nextTs;
  }

  return clone;
}

function normalizeTimestampEntry(entry: unknown): unknown {
  if (!entry || typeof entry !== 'object') return entry;
  const anyEntry = entry as O;
  const clone: O = { ...anyEntry };
  const text = clone.text as O | undefined;
  if (text && typeof text === 'object') {
    const nextText: O = { ...text };
    for (const key of ['headline', 'tagline', 'body'] as const) {
      if (nextText[key] === null) delete nextText[key];
    }
    clone.text = nextText;
  }
  return clone;
}

