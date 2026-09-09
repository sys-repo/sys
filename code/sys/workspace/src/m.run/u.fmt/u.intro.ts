import { c, Cli, type t } from '../common.ts';

const INTRO_LABEL_WIDTH = 15;
const INTRO_MIN_WIDTH = 40;
const INTRO_FALLBACK_WIDTH = 100;
const INTRO_SEPARATOR = '  →  ';

/** Format one aligned, low-noise runner intro line. */
export function formatIntroLine(
  label: string,
  message: string,
  options?: t.WorkspaceRun.Fmt.IntroLineOptions,
): string {
  const width = Cli.Fmt.Text.Width.fit({
    width: options?.width,
    terminal: options?.terminal,
    fallbackWidth: INTRO_FALLBACK_WIDTH,
    minWidth: INTRO_MIN_WIDTH,
  });
  const left = Cli.Fmt.Text.Width.padEnd(label, INTRO_LABEL_WIDTH);
  const prefix = `${left}${INTRO_SEPARATOR}`;
  const line = `${prefix}${message}`;
  if (width <= 0 || Cli.Fmt.Text.Width.measure(line) <= width) return c.gray(line);

  const continuationIndent = Cli.Fmt.Text.Width.measure(prefix);
  const messageLines = Cli.Fmt.Text.Wrap.lines(message, {
    width,
    indent: continuationIndent,
    continuationIndent,
    preserve: 'none',
  });
  const first = messageLines[0] ?? '';
  const rest = messageLines.slice(1);
  const lines = [`${prefix}${first.trimStart()}`];
  rest.forEach((item) => lines.push(item));
  return c.gray(lines.join('\n'));
}
