import { Zip } from '@sys/archive/zip';
import { Snapshot } from '@sys/fs/snapshot';
import type { t } from './common.ts';
import { Json, Schedule } from './common.ts';
import { isGuardFailure } from '../u/u.guard.ts';

/**
 * Render only display text; the caller retains the complete owner-provided inspection details.
 */
export async function renderInspection(
  inspection: t.Inspection,
  resolved: string,
  policy: t.Policy,
  check: () => void,
) {
  const heading = `ZIP32 inspection: ${displayPath(resolved)}`;
  const boundedHeading = boundedText(heading, Math.floor(policy.maxDisplayChars / 2));
  const lines = [
    boundedHeading,
    `source=${inspection.sourceBytes} files=${inspection.fileCount} directories=${inspection.directoryCount} tree=${inspection.treeEntryCount} compressed=${inspection.compressedBytes} expanded=${inspection.expandedBytes}`,
    `methods: stored=${inspection.usage.storedEntries} deflate=${inspection.usage.deflatedEntries}; flags: utf8=${inspection.usage.utf8Entries} descriptor=${inspection.usage.descriptorEntries}`,
  ];
  let chars = lines.join('\n').length;
  let included = 0;
  for (const entry of inspection.entries) {
    check();
    const line = formatEntry(entry);
    const omitted = inspection.entries.length - included - 1;
    const footer = omitted > 0 ? `\n[display truncated: ${omitted} entries omitted]` : '';
    if (chars + 1 + line.length + footer.length > policy.maxDisplayChars) break;
    lines.push(line);
    chars += 1 + line.length;
    included++;
    if (included % 32 === 0) {
      await Schedule.tick();
      check();
    }
  }
  const omitted = inspection.entries.length - included;
  if (omitted > 0) lines.push(`[display truncated: ${omitted} entries omitted]`);
  return { text: lines.join('\n'), truncated: omitted > 0 || boundedHeading !== heading };
}

/**
 * Escape terminal controls and quote paths independently of structured data.
 */
export function displayPath(path: string): string {
  const escaped = path.replace(
    /[\p{Cc}\u2028-\u202e\u2066-\u2069]/gu,
    (char) => {
      return `\\u{${char.charCodeAt(0).toString(16).padStart(4, '0')}}`;
    },
  );
  return Json.stringify(escaped);
}

/**
 * Bound display text without treating truncation as successful data omission.
 */
export function boundedText(text: string, max: number): string {
  if (text.length <= max) return text;
  const marker = ' [display truncated]';
  return `${text.slice(0, Math.max(0, max - marker.length))}${marker}`;
}

/**
 * Format only authenticated failure fields; never inspect arbitrary error text or causes.
 */
export function toolFailure(
  name: t.ToolName,
  requested: string,
  error: unknown,
  max: number,
): Error {
  const suffix = `: ${toolFailureReason(error)}.`;
  const prefix = `${name} failed for `;
  const path = boundedText(displayPath(requested), max - prefix.length - suffix.length);
  return new Error(`${prefix}${path}${suffix}`);
}

/**
 * Select the authenticated reason independently of path context and presentation budgets.
 */
export function toolFailureReason(error: unknown): string {
  if (isGuardFailure(error)) return error.message;
  if (Zip.Is.failure(error)) {
    return `ZIP ${error.operation} ${error.kind}${
      error.entryIndex === undefined ? '' : ` at entry ${error.entryIndex}`
    }`;
  }
  if (Snapshot.Is.failure(error)) return `source snapshot ${error.kind}`;
  return 'unexpected bounded ZIP tool failure';
}

function formatEntry(entry: t.Entry) {
  const crc = entry.crc32.toString(16).padStart(8, '0');
  return `${entry.index}: ${
    displayPath(entry.path)
  } kind=${entry.kind} method=${entry.compression} compressed=${entry.compressedBytes} expanded=${entry.expandedBytes} crc32=${crc} creator=${entry.creatorSystem} utf8=${entry.utf8} descriptor=${entry.dataDescriptor} deflate=${entry.deflateOption} localOffset=${entry.localHeaderOffset}`;
}
