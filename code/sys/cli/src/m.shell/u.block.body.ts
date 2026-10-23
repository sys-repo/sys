import { Str, type t } from './common.ts';
import { isMarkerLine } from './u.block.markers.ts';

export function renderLines(args: t.Shell.Block.RenderArgs): readonly string[] {
  const lines = [
    `# Generated settings. Do not manually edit. Update with \`${args.owner.commandHint}\`.`,
  ];

  args.model.paths.forEach((entry) => {
    lines.push('', itemComment('path', entry.id));
    lines.push(...entry.expression.split(/\r?\n/));
  });

  args.model.aliases.forEach((entry) => {
    lines.push('', itemComment('alias', entry.id));
    lines.push(`alias ${entry.name}="${shellQuoteDouble(entry.command)}"`);
  });

  lines.push('');
  return lines;
}

export function parseModel(owner: t.Shell.Owner, blockText: string): t.Shell.ManagedModel {
  const lines = blockText.split(/\r?\n/);
  const aliases: t.Shell.Alias.Entry[] = [];
  const paths: t.Shell.Path.Entry[] = [];

  lines.forEach((line, index) => {
    const item = parseItemComment(line);
    if (!item) return;

    if (item.kind === 'alias') {
      const alias = parseAlias(item.id, lines[index + 1]);
      if (alias) aliases.push(alias);
      return;
    }

    const expression = expressionAfterItem(owner, lines, index + 1);
    paths.push({ id: item.id, expression, label: item.id });
  });

  return { aliases, paths };
}

/**
 * Helpers:
 */
function parseItemComment(line: string) {
  const match = line.match(/^# (alias|path):\s*(.+)$/);
  if (!match) return undefined;

  const kind = match[1] as 'alias' | 'path';
  const id = match[2]!.trim();
  if (id.length === 0) return undefined;
  return { kind, id } as const;
}

function parseAlias(id: string, line: string | undefined): t.Shell.Alias.Entry | undefined {
  if (!line) return undefined;
  const match = line.match(/^alias\s+([^=]+)="(.*)"$/);
  if (!match) return undefined;
  return {
    id,
    name: match[1]!.trim(),
    command: shellUnquoteDouble(match[2]!),
    risk: 'safe',
  };
}

function expressionAfterItem(
  owner: t.Shell.Owner,
  lines: readonly string[],
  start: number,
): string {
  const out: string[] = [];
  for (const line of lines.slice(start)) {
    if (isMarkerLine(owner, line) || parseItemComment(line) || line.length === 0) break;
    out.push(line);
  }
  return out.join('\n');
}

function itemComment(kind: 'alias' | 'path', id: string): string {
  return `# ${kind}: ${id}`;
}

function shellQuoteDouble(input: string): string {
  return Str.replaceAll(Str.replaceAll(input, /\\/g, '\\\\').after, /"/g, '\\"').after;
}

function shellUnquoteDouble(input: string): string {
  return Str.replaceAll(Str.replaceAll(input, /\\"/g, '"').after, /\\\\/g, '\\').after;
}
