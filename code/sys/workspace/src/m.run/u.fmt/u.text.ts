import { Cli, type t } from '../common.ts';

const HANDOFF_FALLBACK_WIDTH = 100;
const HANDOFF_MIN_WIDTH = 40;

type WidthOptions = {
  readonly terminal?: boolean;
  readonly width?: number;
};

export function fitHandoffWidth(options: WidthOptions) {
  return Cli.Fmt.Text.Width.fit({
    width: options.width,
    terminal: options.terminal,
    fallbackWidth: HANDOFF_FALLBACK_WIDTH,
    minWidth: HANDOFF_MIN_WIDTH,
  });
}

export function appendWrapped(
  str: t.Str.Builder,
  prefix: string,
  text: string,
  width: number,
) {
  if (width <= 0) {
    str.line(`${prefix}${text}`);
    return;
  }

  const indent = Cli.Fmt.Text.Width.measure(prefix);
  const lines = Cli.Fmt.Text.Wrap.lines(text, {
    width,
    indent,
    continuationIndent: indent,
    preserve: 'none',
  });
  const first = lines[0];
  if (!first) return;
  str.line(`${prefix}${first.trimStart()}`);
  lines.slice(1).forEach((line) => str.line(line));
}

export function displayNumber(value: number) {
  return value.toLocaleString('en-US');
}

export function taskNoun(task: t.WorkspaceRun.Task) {
  if (task === 'test') return 'tests';
  if (task === 'dry') return 'dry runs';
  return 'checks';
}

export function indentedTable(table: t.Cli.Table.Instance) {
  const lines = String(table).split('\n');
  while (lines[0]?.trim() === '') lines.shift();
  while (lines.at(-1)?.trim() === '') lines.pop();

  return lines
    .map((line) => (line.trim() ? ` ${line}` : line))
    .join('\n');
}
