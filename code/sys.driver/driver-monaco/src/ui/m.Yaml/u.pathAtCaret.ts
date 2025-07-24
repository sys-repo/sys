import type { Document } from 'yaml';
import { type t, Yaml } from './common.ts';

type Result = Readonly<{ path: t.ObjectPath; offset: number }>;

/**
 * Compute the YAML object-path (array of string|number) for the caret location.
 *
 * The caret comes from a Monaco editor. `pathAtCaret`:
 *  1. Biases the raw caret to the first non-whitespace character on that line.
 *  2. Clears the path on blank/whitespace-only lines.
 *  3. Works around a yaml-ast "previous node" stickiness by scanning forward
 *     (up to `limit` chars) until the path actually changes.
 *
 * @example
 * const { path } = pathAtCaret(model, doc, { lineNumber: 2, column: 1 });
 * // → ['bar']
 */
export function pathAtCaret(
  model: t.Monaco.TextModel,
  doc: Document.Parsed,
  position: t.Monaco.I.IPosition,
  limit: number = 512, // Max chars to scan forward.
): Result {
  const lineText = model.getLineContent(position.lineNumber);

  // Blank / whitespace-only line → no path.
  if (/^\s*$/.test(lineText)) return { path: [], offset: -1 };

  /**
   * Bias caret to first visible char (avoid prev-node stickiness):
   */
  const firstIdx = lineText.search(/\S/); // ← 0-based.
  const firstCol = firstIdx + 1; //          ← 1-based.
  let col = position.column;

  if (col <= firstCol) col = firstCol;
  if (col === 1 && position.lineNumber !== 1) col = 2; // newline edge

  if (col > lineText.length + 1) col = lineText.length + 1;

  const offset = model.getOffsetAt({ lineNumber: position.lineNumber, column: col });
  let path = Yaml.pathAtOffset(doc.contents, offset);

  /**
   * Forward scan if still glued to previous node when at column-1.
   */
  if (position.column === 1 && position.lineNumber !== 1) {
    const prevPath = offset > 0 ? Yaml.pathAtOffset(doc.contents, offset - 1) : [];
    if (samePath(prevPath, path)) {
      const max = model.getValueLength();
      const end = Math.min(max, offset + limit);
      for (let o = offset + 1; o < end; o++) {
        const p = Yaml.pathAtOffset(doc.contents, o);
        if (!samePath(prevPath, p)) {
          path = p;
          break;
        }
      }
    }
  }

  /**
   * API:
   */
  return { path, offset } as const;
}

/**
 * Shallow equality for object paths.
 */
export function samePath(a: t.ObjectPath, b: t.ObjectPath) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
