import { Str, type t } from './common.ts';

type LineEnding = '\n' | '\r\n';

type LocatedBlock = {
  readonly state: t.Shell.Block.State;
  readonly range?: { readonly start: number; readonly end: number };
};

type LineSpan = {
  readonly text: string;
  readonly start: number;
  readonly end: number;
};

/** Managed shell block helpers. */
export const Block: t.Shell.Block.Lib = {
  markers,
  render,
  detect: (args) => locate(args).state,
  update,
  remove,
};

/**
 * Helpers:
 */
function markers(owner: t.Shell.Owner): t.Shell.Block.Markers {
  return {
    start: `# >>> ${owner.label}`,
    end: `# <<< ${owner.label}`,
  };
}

function render(args: t.Shell.Block.RenderArgs): string {
  const newline = args.newline ?? '\n';
  const lines = [
    markers(args.owner).start,
    `# Managed by ${args.owner.label}. Edit with: ${args.owner.commandHint}`,
  ];

  args.model.paths.forEach((entry) => {
    lines.push('', itemComment(args.owner, 'path', entry.id));
    lines.push(...entry.expression.split(/\r?\n/));
  });

  args.model.aliases.forEach((entry) => {
    lines.push('', itemComment(args.owner, 'alias', entry.id));
    lines.push(`alias ${entry.name}="${shellQuoteDouble(entry.command)}"`);
  });

  lines.push('', markers(args.owner).end);
  return `${lines.join(newline)}${newline}`;
}

function update(args: t.Shell.Block.UpdateArgs): t.Shell.Plan {
  const newline = args.newline ?? newlineOf(args.text);
  const block = render({ ...args, newline });
  const located = locate(args);

  if (located.state.kind === 'invalid') {
    return invalidPlan(args.text, located.state);
  }

  if (located.state.kind === 'missing') {
    const nextText = appendBlock(args.text, block, newline);
    return {
      kind: 'add',
      block: located.state,
      nextText,
      changed: nextText !== args.text,
      warnings: [],
    };
  }

  const range = located.range;
  if (!range) return invalidPlan(args.text, { kind: 'invalid', reason: 'partial-markers' });

  const nextText = `${args.text.slice(0, range.start)}${block}${args.text.slice(range.end)}`;
  return {
    kind: nextText === args.text ? 'unchanged' : 'replace',
    block: located.state,
    nextText,
    changed: nextText !== args.text,
    warnings: warningsFor(located.state),
  };
}

function remove(args: t.Shell.Block.RemoveArgs): t.Shell.Plan {
  const located = locate(args);

  if (located.state.kind === 'invalid') {
    return invalidPlan(args.text, located.state);
  }

  if (located.state.kind === 'missing') {
    return {
      kind: 'unchanged',
      block: located.state,
      nextText: args.text,
      changed: false,
      warnings: [],
    };
  }

  const range = located.range;
  if (!range) return invalidPlan(args.text, { kind: 'invalid', reason: 'partial-markers' });

  const nextText = `${args.text.slice(0, range.start)}${args.text.slice(range.end)}`;
  return {
    kind: 'remove',
    block: located.state,
    nextText,
    changed: nextText !== args.text,
    warnings: [],
  };
}

function locate(args: t.Shell.Block.DetectArgs): LocatedBlock {
  const mark = markers(args.owner);
  const starts = markerLines(args.text, mark.start);
  const ends = markerLines(args.text, mark.end);

  if (starts.length === 0 && ends.length === 0) return { state: { kind: 'missing' } };
  if (starts.length > 1 || ends.length > 1) return invalidLocated('multiple-blocks');
  if (starts.length !== ends.length) return invalidLocated('partial-markers');

  const start = starts[0]!;
  const end = ends[0]!;
  if (end.start < start.start) return invalidLocated('partial-markers');

  const blockText = args.text.slice(start.start, end.end);
  const model = parseModel(args.owner, blockText);
  return {
    state: {
      kind: 'present',
      model,
      stale: blockText !== render({ owner: args.owner, model, newline: newlineOf(blockText) }),
    },
    range: { start: start.start, end: end.end },
  };
}

function parseModel(owner: t.Shell.Owner, blockText: string): t.Shell.ManagedModel {
  const lines = blockText.split(/\r?\n/);
  const aliases: t.Shell.AliasEntry[] = [];
  const paths: t.Shell.PathEntry[] = [];

  lines.forEach((line, index) => {
    const item = parseItemComment(owner, line);
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

function parseItemComment(owner: t.Shell.Owner, line: string) {
  const prefix = itemPrefix(owner);
  if (!line.startsWith(prefix)) return undefined;

  const rest = line.slice(prefix.length).trim();
  const space = rest.indexOf(' ');
  if (space < 0) return undefined;

  const kind = rest.slice(0, space);
  const id = rest.slice(space + 1).trim();
  if ((kind !== 'alias' && kind !== 'path') || id.length === 0) return undefined;
  return { kind, id } as const;
}

function parseAlias(id: string, line: string | undefined): t.Shell.AliasEntry | undefined {
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

function expressionAfterItem(owner: t.Shell.Owner, lines: readonly string[], start: number): string {
  const out: string[] = [];
  const prefix = itemPrefix(owner);
  for (const line of lines.slice(start)) {
    if (
      line.startsWith('# >>> ') || line.startsWith('# <<< ') || line.startsWith(prefix) ||
      line.length === 0
    ) break;
    out.push(line);
  }
  return out.join('\n');
}

function appendBlock(text: string, block: string, newline: LineEnding): string {
  if (text.length === 0) return block;
  const suffix = text.endsWith('\n') ? newline : `${newline}${newline}`;
  return `${text}${suffix}${block}`;
}

function markerLines(text: string, marker: string): readonly LineSpan[] {
  return lineSpans(text).filter((line) => line.text === marker);
}

function lineSpans(text: string): readonly LineSpan[] {
  const spans: LineSpan[] = [];
  let start = 0;
  text.split(/(?<=\n)/).forEach((raw) => {
    if (raw.length === 0) return;
    const end = start + raw.length;
    spans.push({ text: trimLineEnding(raw), start, end });
    start = end;
  });
  return spans;
}

function trimLineEnding(input: string): string {
  if (input.endsWith('\r\n')) return input.slice(0, -2);
  if (input.endsWith('\n')) return input.slice(0, -1);
  return input;
}

function newlineOf(text: string): LineEnding {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

function itemComment(owner: t.Shell.Owner, kind: 'alias' | 'path', id: string): string {
  return `${itemPrefix(owner)}${kind} ${id}`;
}

function itemPrefix(owner: t.Shell.Owner): string {
  return `# ${owner.id} `;
}

function shellQuoteDouble(input: string): string {
  return Str.replaceAll(Str.replaceAll(input, /\\/g, '\\\\').after, /"/g, '\\"').after;
}

function shellUnquoteDouble(input: string): string {
  return Str.replaceAll(Str.replaceAll(input, /\\"/g, '"').after, /\\\\/g, '\\').after;
}

function warningsFor(block: t.Shell.Block.State): readonly string[] {
  if (block.kind === 'present' && block.stale) {
    return ['Managed shell block has manual edits and will be normalized'];
  }
  return [];
}

function invalidLocated(reason: 'partial-markers' | 'multiple-blocks'): LocatedBlock {
  return { state: { kind: 'invalid', reason } };
}

function invalidPlan(text: string, block: t.Shell.Block.State): t.Shell.Plan {
  const reason = block.kind === 'invalid' ? block.reason : 'partial-markers';
  return {
    kind: 'unchanged',
    block,
    nextText: text,
    changed: false,
    warnings: [`Cannot update invalid managed shell block: ${reason}`],
  };
}
