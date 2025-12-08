import { type t } from '../common.ts';

/**
 * Normalize an editor-authored YAML sequence into the typed YAML shape (`t.Sequence`).
 *
 * This is a light-weight cleanup pass that prepares loose editor YAML for the
 * Typed-Yaml schema (the first validation layer). It stabilizes shape while
 * preserving semantics. A later stage maps this typed YAML shape into the
 * canonical `TimecodeCompositionSpec` in `@sys/std/time/timecode` for
 * `<CompositeVideo>`.
 */
export function normalizeEditorSequenceForTypedYaml(input: unknown): t.Sequence | undefined {
  if (!Array.isArray(input)) return undefined;
  return input.map((item) => normalizeSequenceItem(item)) as t.Sequence;
}

/**
 * Normalize a single item within the typed YAML sequence.
 *
 * Only known nested shapes (such as `timestamps`) are cleaned. Everything else
 * passes through unchanged. The intent is to keep editor YAML permissive while
 * giving the Typed-Yaml schema a predictable structure.
 */
function normalizeSequenceItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item;
  const anyItem = item as Record<string, unknown>;
  const clone: Record<string, unknown> = { ...anyItem };

  const timestamps = clone.timestamps as Record<string, unknown> | undefined;
  if (timestamps && typeof timestamps === 'object') {
    const nextTs: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(timestamps)) {
      nextTs[key] = normalizeTimestampEntry(value);
    }
    clone.timestamps = nextTs;
  }

  return clone;
}

/**
 * Normalize a single timestamp entry within the typed YAML shape.
 *
 * Known text fields (`headline`, `tagline`, `body`) treat explicit `null` as
 * “not present” so the schema and downstream canonical spec can distinguish
 * intentionally set values from unset ones. Unrelated properties are untouched.
 */
function normalizeTimestampEntry(entry: unknown): unknown {
  if (!entry || typeof entry !== 'object') return entry;
  const anyEntry = entry as Record<string, unknown>;
  const clone: Record<string, unknown> = { ...anyEntry };

  const text = clone.text as Record<string, unknown> | undefined;
  if (text && typeof text === 'object') {
    const nextText: Record<string, unknown> = { ...text };

    for (const key of ['headline', 'tagline', 'body'] as const) {
      if (nextText[key] === null) {
        delete nextText[key];
      }
    }

    clone.text = nextText;
  }

  return clone;
}
