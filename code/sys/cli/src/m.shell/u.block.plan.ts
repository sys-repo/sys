import { TextBlock } from '@sys/text/block';
import { TextUpdate } from '@sys/text/update';
import { Is, type t } from './common.ts';
import { renderLines } from './u.block.body.ts';
import { locate, mapInvalidReason } from './u.block.locate.ts';

type LineEnding = '\n' | '\r\n';

export function update(args: t.Shell.Block.UpdateArgs): t.Shell.Plan {
  const newline = args.newline ?? TextUpdate.newlineOf(args.text);
  const located = locate(args);

  if (located.state.kind === 'invalid') return invalidPlan(args.text, located.state);

  const text = located.state.kind === 'missing'
    ? textWithShellSeparator(args.text, newline)
    : args.text;
  const result = TextBlock.update({
    text,
    markers: located.markers,
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

export function remove(args: t.Shell.Block.RemoveArgs): t.Shell.Plan {
  const located = locate(args);
  if (located.state.kind === 'invalid') return invalidPlan(args.text, located.state);

  const result = TextBlock.remove({ text: args.text, markers: located.markers });
  return {
    kind: result.kind === 'invalid' ? 'unchanged' : result.kind,
    block: located.state,
    nextText: result.kind === 'invalid' ? args.text : result.after,
    changed: result.kind !== 'invalid' && result.changed,
    warnings: result.kind === 'invalid' ? invalidWarnings(result.state) : [],
  };
}

/**
 * Helpers:
 */
function textWithShellSeparator(text: string, newline: LineEnding): string {
  if (text.length === 0) return text;
  return text.endsWith('\n') ? `${text}${newline}` : `${text}${newline}${newline}`;
}

function warningsFor(block: t.Shell.Block.State): readonly string[] {
  if (block.kind === 'present' && block.stale) {
    return ['Managed shell block has manual edits and will be normalized'];
  }
  return [];
}

function invalidWarnings(state: unknown): readonly string[] {
  const reason = Is.record(state) && Is.string(state.reason)
    ? mapInvalidReason(state.reason)
    : 'partial-markers';
  return [`Cannot update invalid managed shell block: ${reason}`];
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
