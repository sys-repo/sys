import type { t } from '../common.ts';

/**
 * Normalize line endings, remove one template-edge blank line per side from
 * content-bearing text, and remove the smallest shared space/tab indentation.
 * Additional edge blank lines and relative interior indentation are preserved.
 */
export const dedent: t.Str.Lib['dedent'] = (str) => {
  const lines = str.replace(/\r\n?/g, '\n').split('\n');
  const hasContent = lines.some((line) => !isBlank(line));

  if (isTemplateEdge(lines[0], hasContent)) lines.shift();
  if (isTemplateEdge(lines[lines.length - 1], hasContent)) lines.pop();

  const min = minIndent(lines);
  return lines.map((line) => line.slice(Math.min(min, indentOf(line)))).join('\n');
};

/**
 * Helpers:
 */
function isTemplateEdge(line: string | undefined, hasContent: boolean) {
  return line === '' || (hasContent && line !== undefined && isBlank(line));
}

function isBlank(line: string) {
  return line.trim().length === 0;
}

function indentOf(line: string) {
  return line.match(/^[ \t]*/)?.[0].length ?? 0;
}

function minIndent(lines: readonly string[]) {
  let min: number | undefined;
  for (const line of lines) {
    if (isBlank(line)) continue;
    const indent = indentOf(line);
    min = min === undefined ? indent : Math.min(min, indent);
    if (min === 0) break;
  }
  return min ?? 0;
}
