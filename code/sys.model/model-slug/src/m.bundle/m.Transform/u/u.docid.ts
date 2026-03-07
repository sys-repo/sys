import type { t } from './common.ts';

const URI_PREFIX = 'crdt:';

/**
 * Pure local docid normalization for bundle template substitution.
 *
 * This helper intentionally does not validate Automerge/CRDT ids and does not depend on CRDT
 * runtime packages. It normalizes lexical input only:
 * - trims surrounding whitespace
 * - strips a lowercase `crdt:` prefix when present
 */
export function cleanDocid(input: t.SlugBundleTransform.DocIdInput): string {
  const value = String(input ?? '').trim();
  if (!value.startsWith(URI_PREFIX)) return value;
  return value.slice(URI_PREFIX.length);
}

