import { c, type t } from '../common.ts';

export const Commit: t.CliFormatCommit.Lib = Object.freeze({
  suggestion(message, options = {}) {
    const title = options.title ?? 'suggested commit msg:';
    const indent = Math.max(0, options.indent ?? 0);
    const pad = ' '.repeat(indent);
    const lines = [];

    if (title !== false) lines.push(renderTitle(title));
    lines.push(renderText(message, options.message));

    return lines.map((line) => `${pad}${line}`).join('\n');
  },
});

function renderTitle(title: Exclude<t.CliFormatCommit.Title, false>) {
  if (typeof title === 'string') {
    return renderText(title, { color: 'brightCyan', bold: true });
  }

  return renderText(title.text ?? 'suggested commit msg:', {
    color: title.color ?? 'brightCyan',
    bold: title.bold ?? true,
    italic: title.italic,
  });
}

function renderText(text: string, options: t.CliFormatCommit.Text = {}) {
  const color = options.color ?? 'white';
  const bold = options.bold ?? false;
  const italic = options.italic ?? false;

  let res = c[color](text);
  if (italic) res = c.italic(res);
  if (bold) res = c.bold(res);
  return res;
}
