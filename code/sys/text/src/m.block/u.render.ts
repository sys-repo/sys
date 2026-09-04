import { Is, type t } from './common.ts';
import { hasNewline, validateMarkers } from './u.validate.ts';

/** Render a marker-bounded block. */
export const render: t.TextBlock.Render = (args) => {
  const invalid = validateMarkers(args.markers);
  if (invalid) throw new TypeError(invalid);

  const newline = args.newline ?? '\n';
  const content = renderContent(args, newline);
  const separator = content.length > 0 && !content.endsWith('\n') ? newline : '';
  return `${args.markers.start}${newline}${content}${separator}${args.markers.end}${newline}`;
};

/**
 * Helpers:
 */
function renderContent(args: t.TextBlock.RenderArgs, newline: t.TextBlock.Newline): string {
  const content = (args as { readonly content?: unknown }).content;
  const lines = (args as { readonly lines?: unknown }).lines;
  if (content !== undefined && lines !== undefined) {
    throw new TypeError('TextBlock render accepts either content or lines, not both');
  }
  if (lines !== undefined) return renderLines(lines, newline);
  if (content === undefined) return '';
  if (!Is.string(content)) throw new TypeError('TextBlock content must be a string');
  return content;
}

function renderLines(lines: unknown, newline: t.TextBlock.Newline): string {
  if (!Is.array(lines)) throw new TypeError('TextBlock lines must be an array');

  let out = '';
  for (const line of lines) {
    if (!Is.string(line)) throw new TypeError('TextBlock line must be a string');
    if (hasNewline(line)) {
      throw new TypeError('TextBlock lines must not contain CR or LF characters');
    }
    out += `${line}${newline}`;
  }
  return out;
}
