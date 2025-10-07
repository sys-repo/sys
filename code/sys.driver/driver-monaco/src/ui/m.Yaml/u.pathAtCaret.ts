import type { Document as YamlDocument } from 'yaml';
import { Num, type t, Yaml } from './common.ts';

type Result = Readonly<{ path: t.ObjectPath; offset: number }>;

/**
 * YAML path at caret (clamped, whitespace-aware;
 * forward-scan to avoid prev-node stickiness).
 */
export function pathAtCaret(
  model: t.Monaco.TextModel,
  ast: YamlDocument.Parsed,
  position: t.Monaco.I.IPosition,
  limit: number = 512,
): Result {
  const lineCount = Math.max(1, model.getLineCount());
  const line = Num.clamp(1, lineCount, position.lineNumber || 1);
  const lineText = model.getLineContent(line);

  // Blank / whitespace-only line → no path.
  if (/^\s*$/.test(lineText)) return { path: [], offset: -1 };

  /**
   * Bias caret to first visible char (avoid prev-node stickiness):
   */
  const firstIdx = lineText.search(/\S/); // ← 0-based
  const firstCol = firstIdx + 1; //          ← 1-based

  let col = position.column || 1;
  const isAtOrBeforeFirstVisible = col <= firstCol;
  const maxCol = lineText.length + 1;
  col = Math.max(firstCol, Math.min(col, maxCol));

  const offset = model.getOffsetAt({ lineNumber: line, column: col });

  // If the AST is empty or missing, return empty path gracefully.
  const root = (ast && (ast as any).contents) ?? undefined;
  let path = root ? Yaml.Path.atOffset(root, offset) : [];

  /**
   * Forward scan if still glued to previous node when at column-1.
   */
  if (root && isAtOrBeforeFirstVisible && line > 1) {
    const prevPath = offset > 0 ? Yaml.Path.atOffset(root, offset - 1) : [];
    if (samePath(prevPath, path)) {
      const max = model.getValueLength();
      const end = Math.min(max, offset + limit);
      for (let o = offset + 1; o < end; o++) {
        const p = Yaml.Path.atOffset(root, o);
        if (!samePath(prevPath, p)) {
          path = p;
          break;
        }
      }
    }
  }

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
