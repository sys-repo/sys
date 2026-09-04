import { Is, type t } from './common.ts';

/** Validate exact text block markers. */
export function validateMarkers(markers: unknown): string | undefined {
  if (!Is.record(markers)) return 'TextBlock markers must be a record';
  const start = markers.start;
  const end = markers.end;
  if (!Is.string(start) || !Is.string(end)) return 'TextBlock markers must be strings';
  if (start.length === 0 || end.length === 0) return 'TextBlock markers must be non-empty';
  if (start === end) return 'TextBlock start and end markers must differ';
  if (hasNewline(start) || hasNewline(end)) return 'TextBlock markers must not contain CR or LF';
  return undefined;
}

/** Build an invalid block detection state. */
export function invalidState(
  reason: t.TextBlock.InvalidReason,
  message: string,
): t.TextBlock.State {
  return { kind: 'invalid', reason, message };
}

/** Determine whether text contains a physical newline token. */
export function hasNewline(input: string): boolean {
  return input.includes('\n') || input.includes('\r');
}
