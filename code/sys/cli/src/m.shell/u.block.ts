import { Is, Str, type t, TextBlock, TextUpdate } from './common.ts';

type LineEnding = '\n' | '\r\n';

type LocatedBlock = {
  readonly state: t.Shell.Block.State;
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
  return TextBlock.render({ markers: markers(args.owner), lines: renderLines(args), newline });
}

function update(args: t.Shell.Block.UpdateArgs): t.Shell.Plan {
  const newline = args.newline ?? TextUpdate.newlineOf(args.text);
  const located = locate(args);

  if (located.state.kind === 'invalid') return invalidPlan(args.text, located.state);

  const text = located.state.kind === 'missing'
    ? textWithShellSeparator(args.text, newline)
    : args.text;
  const result = TextBlock.update({
    text,
    markers: markers(args.owner),
    lines: renderLines(args),
    newline,
  });

  return {
    kind: result.kind === 'invalid' ? 'unchanged' : result.kind,
    block: located.state,
    nextText: result.kind === 'invalid' ? args.text : result.after,
    changed: result.kind !== 'invalid' && result.after !== args.text,
    warnings: result.kind === 'invalid'
      ? invalidWarnings(result.state)
      : warningsFor(located.state),
  };
}

function remove(args: t.Shell.Block.RemoveArgs): t.Shell.Plan {
  const located = locate(args);
  if (located.state.kind === 'invalid') return invalidPlan(args.text, located.state);

  const result = TextBlock.remove({ text: args.text, markers: markers(args.owner) });
  return {
    kind: result.kind === 'invalid' ? 'unchanged' : result.kind,
    block: located.state,
    nextText: result.kind === 'invalid' ? args.text : result.after,
    changed: result.kind !== 'invalid' && result.changed,
    warnings: result.kind === 'invalid' ? invalidWarnings(result.state) : [],
  };
}

function locate(args: t.Shell.Block.DetectArgs): LocatedBlock {
  const state = TextBlock.detect({ text: args.text, markers: markers(args.owner) });
  if (state.kind === 'missing') return { state };
  if (state.kind === 'invalid') return invalidLocated(mapInvalidReason(state.reason));

  const model = parseModel(args.owner, state.block);
  return {
    state: {
      kind: 'present',
      model,
      stale: state.block !== render({ owner: args.owner, model, newline: state.newline }),
    },
  };
}

function parseModel(owner: t.Shell.Owner, blockText: string): t.Shell.ManagedModel {
  const lines = blockText.split(/\r?\n/);
  const aliases: t.Shell.Alias.Entry[] = [];
  const paths: t.Shell.Path.Entry[] = [];

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

function renderLines(args: t.Shell.Block.RenderArgs): readonly string[] {
  const lines = [`# Managed by ${args.owner.label}. Edit with: ${args.owner.commandHint}`];

  args.model.paths.forEach((entry) => {
    lines.push('', itemComment(args.owner, 'path', entry.id));
    lines.push(...entry.expression.split(/\r?\n/));
  });

  args.model.aliases.forEach((entry) => {
    lines.push('', itemComment(args.owner, 'alias', entry.id));
    lines.push(`alias ${entry.name}="${shellQuoteDouble(entry.command)}"`);
  });

  lines.push('');
  return lines;
}

function textWithShellSeparator(text: string, newline: LineEnding): string {
  if (text.length === 0) return text;
  return text.endsWith('\n') ? `${text}${newline}` : `${text}${newline}${newline}`;
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

function mapInvalidReason(reason: string): 'partial-markers' | 'multiple-blocks' {
  return reason === 'multiple-blocks' ? 'multiple-blocks' : 'partial-markers';
}

function invalidWarnings(state: unknown): readonly string[] {
  const reason = Is.record(state) && Is.string(state.reason)
    ? mapInvalidReason(state.reason)
    : 'partial-markers';
  return [`Cannot update invalid managed shell block: ${reason}`];
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
