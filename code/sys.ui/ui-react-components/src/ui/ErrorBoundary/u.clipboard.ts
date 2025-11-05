import { Json } from './common.ts';

/**
 * Copies a useful, human-readable rendering of an <unknown> error to the clipboard.
 */
export async function copyToClipboard(err: any) {
  const text = formatErrorForClipboard(err);
  await navigator.clipboard.writeText(text);
}

/**
 * Produces a compact, stable text dump for JS Errors or arbitrary values.
 * Safe against getters and circular structures.
 */
export function formatErrorForClipboard(err: any): string {
  const isErr = isErrorLike(err);
  const name = safeGet(err, 'name');
  const message = safeGet(err, 'message');
  const stack = safeGet(err, 'stack');
  const cause = safeGet(err, 'cause');

  const lines: string[] = [];

  // Title line.
  const title = isErr ? (name ? String(name) : 'Error') : 'Non-Error value thrown';
  const msg = isErr && message ? `: ${String(message)}` : '';
  const titleLine = `${title}${msg}`;
  lines.push(titleLine);

  // Stack (if present).
  const stackText = normalizeStack(stack);
  if (stackText) {
    const clean = stripDuplicateTitle(stackText, titleLine);
    if (clean.trim()) {
      lines.push('');
      lines.push(clean);
    }
  }

  // Cause (if present).
  if (typeof cause !== 'undefined') {
    lines.push('');
    lines.push('cause:');
    lines.push(indent(multilineStringify(cause), 2));
  }

  // Extra enumerable properties (beyond standard name/message/stack/cause).
  const extras = pickEnumerable(err, ['name', 'message', 'stack', 'cause']);
  if (extras && Object.keys(extras).length > 0) {
    lines.push('');
    lines.push('props:');
    lines.push(indent(Json.stringify(extras, 2), 2));
  }

  // If not an Error, include the full value.
  if (!isErr) {
    lines.push('');
    lines.push('value:');
    lines.push(indent(multilineStringify(err), 2));
  }

  return lines.join('\n').trimEnd() + '\n';
}

/**
 * Helpers (intentionally small, no external deps).
 */
function isErrorLike(v: any): boolean {
  return !!v && (v instanceof Error || (typeof v === 'object' && ('message' in v || 'stack' in v)));
}

function safeGet(obj: any, key: string): unknown {
  try {
    return obj?.[key];
  } catch {
    return undefined;
  }
}

function normalizeStack(stack: unknown): string | undefined {
  if (!stack) return undefined;
  if (Array.isArray(stack)) return stack.join('\n');
  if (typeof stack === 'string') return stack.trim();
  return String(stack);
}

function pickEnumerable(obj: any, exclude: readonly string[]) {
  if (!obj || typeof obj !== 'object') return undefined;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) {
    if (!exclude.includes(k)) {
      try {
        out[k] = obj[k];
      } catch {
        out[k] = '[unreadable]';
      }
    }
  }
  return out;
}

function stripDuplicateTitle(stackText: string, titleLine: string): string {
  const lines = stackText.split('\n');
  const first = (lines[0] ?? '').trim();
  return first === titleLine.trim() ? lines.slice(1).join('\n') : stackText;
}

function multilineStringify(value: unknown): string {
  try {
    if (typeof value === 'string') return value;
    return Json.stringify(value, 2);
  } catch {
    return String(value);
  }
}

function indent(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text
    .split('\n')
    .map((line) => (line.length ? pad + line : line))
    .join('\n');
}
