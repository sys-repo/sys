import { type t, c, Str } from '../common.ts';
import { Fmt as Base } from '../u.fmt.ts';

export const Fmt = {
  ...Base,
  tasks,
} as const;

const TODO_WIDTH = 35;
const COMMENT_WIDTH = 60;

export function tasks(docs: readonly t.DocTasks[]): string {
  const b = Str.builder();

  if (!docs.length) {
    b.line(c.gray('No docs with tasks.'));
    return b.toString();
  }

  docs.forEach((entry, docIndex) => {
    const { doc, tasks } = entry;

    if (docIndex > 0) b.blank();

    const uri = Base.prettyUri(doc.id);
    b.line(`${c.bold(c.cyan('Document'))} ${c.gray(uri)}`).blank();

    if (!tasks.length) {
      b.line(c.gray('  (no tasks)'));
      return;
    }

    tasks.forEach((task) => {
      const todoLines = wrapText(task.TODO, TODO_WIDTH);
      const commentLines = task.comment ? wrapText(task.comment, COMMENT_WIDTH) : [];
      const rowHeight = Math.max(todoLines.length, commentLines.length || 1);

      for (let i = 0; i < rowHeight; i += 1) {
        const todoCell = todoLines[i] ?? '';
        const commentCell = commentLines[i] ?? '';
        row(b, todoCell, commentCell);
      }

      b.blank();
    });
  });

  return b.toString();
}

/**
 * Emit a single table row (2 columns).
 */
function row(b: t.StrBuilder, todo: string, comment: string) {
  const todoText = pad(todo, TODO_WIDTH);
  const commentText = pad(comment, COMMENT_WIDTH);
  b.line(`  ${todoText}  ${c.italic(c.gray(commentText))}`);
}

/**
 * Pad or truncate to width.
 */
function pad(value: string, width: number, fill = ' '): string {
  const text = value.length > width ? value.slice(0, width) : value;
  if (text.length >= width) return text;
  return text + fill.repeat(width - text.length);
}

/**
 * Wrap text to width, preserving paragraph breaks.
 */
function wrapText(text: string, width: number): string[] {
  const out: string[] = [];
  const paragraphs = text.split(/\r?\n/);

  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) {
      out.push('');
      continue;
    }

    const words = trimmed.split(/\s+/);
    let line = '';

    for (const w of words) {
      if (w.length > width) {
        if (line) {
          out.push(line);
          line = '';
        }
        let start = 0;
        while (start < w.length) {
          out.push(w.slice(start, start + width));
          start += width;
        }
        continue;
      }

      if (!line) {
        line = w;
      } else if (line.length + 1 + w.length <= width) {
        line = `${line} ${w}`;
      } else {
        out.push(line);
        line = w;
      }
    }

    if (line) out.push(line);
  }

  return out;
}
