import { formatMediaType, Is, parseMediaType, type t } from '../common.ts';

export function parseBare(input?: unknown): t.StringMimeType | undefined {
  if (!Is.string(input) || !hasAssignedParameters(input)) return undefined;

  try {
    const [mediaType] = parseMediaType(input);
    const slash = mediaType.indexOf('/');
    const type = mediaType.slice(0, slash);
    const subtype = mediaType.slice(slash + 1);
    const isConcrete = !type.includes('*') && !subtype.includes('*');
    const hasTypeAndSubtype = slash > 0 &&
      slash === mediaType.lastIndexOf('/') &&
      slash < mediaType.length - 1;
    if (!isConcrete || !hasTypeAndSubtype) return undefined;
    return formatMediaType(mediaType) === mediaType ? mediaType : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Helpers:
 */

/** Guard the parameter-assignment boundary left permissive by the upstream parser. */
function hasAssignedParameters(input: string): boolean {
  const first = input.indexOf(';');
  if (first < 0) return true;

  let start = first + 1;
  let hasEquals = false;
  let quoted = false;
  let escaped = false;

  for (let i = start; i < input.length; i++) {
    const char = input[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quoted) {
      if (char === '\\') escaped = true;
      if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === '=') {
      hasEquals = true;
      continue;
    }
    if (char === ';') {
      if (!hasEquals || !input.slice(start, i).trim()) return false;
      start = i + 1;
      hasEquals = false;
    }
  }

  return hasEquals && input.slice(start).trim().length > 0;
}
