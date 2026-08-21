import { c, Cli, HashFmt, Is, stripAnsi, type t, Time } from './common.ts';

const MINUTE = 60_000;
const DIGEST_ARROW = c.green('←');
const DIGEST_PREFIX_WIDTH = Cli.Fmt.Text.Width.measure(`${DIGEST_ARROW} `);

type MetadataRowArgs = {
  label: string;
  value: string;
  width: number;
  indent?: number;
  labelWidth?: number;
  styledLabel?: string;
  suffix?: (maxWidth: number) => string;
};

export const digest: t.ViteLog.Lib['digest'] = (hash, options = {}) => {
  if (!hash) return '';

  const maxWidth = Is.num(options.maxWidth)
    ? reserveWidth(options.maxWidth, DIGEST_PREFIX_WIDTH)
    : undefined;
  const uri = HashFmt.digest(hash, { maxWidth });
  return uri ? `${DIGEST_ARROW} ${uri}` : '';
};

export const elapsed: t.ViteLog.Lib['elapsed'] = (msec) => {
  if (msec == null) return '-';
  if (msec > MINUTE) return `${(msec / MINUTE).toFixed(2)}m`;
  return String(Time.duration(msec));
};

export const pad: t.ViteLog.Lib['pad'] = (text, pad) => {
  text = text.trim();
  return pad ? `\n${text}\n` : text;
};

export function outputWidth(input?: number) {
  return Is.num(input) ? Math.max(0, Math.floor(input)) : Cli.Fmt.Text.Width.fit();
}

export function reserveWidth(width: number, reserve: number) {
  return Math.max(0, Math.floor(width) - Math.max(0, Math.floor(reserve)));
}

export function clipLine(input: string, width: number) {
  if (width <= 0) return '';
  if (Cli.Fmt.Text.Width.measure(input) <= width) return input;
  return Cli.Fmt.Text.ellipsize(stripAnsi(input), width, {
    render: ({ head, ellipsis, tail }) => {
      return `${c.gray(head)}${Cli.Fmt.omission(ellipsis)}${c.gray(tail)}`;
    },
  });
}

export function clipText(input: string, width: number) {
  if (width <= 0) return '';
  if (Cli.Fmt.Text.Width.measure(input) <= width) return input;
  return Cli.Fmt.Text.ellipsize(input, width);
}

export function clipValue(input: string, width: number) {
  if (width <= 0) return '';
  const text = stripAnsi(input);
  if (Cli.Fmt.Text.Width.measure(text) <= width) return input;
  return Cli.Fmt.Text.ellipsize(text, width, {
    render: ({ head, ellipsis, tail }) => `${head}${Cli.Fmt.omission(ellipsis)}${tail}`,
  });
}

export function metadataRow(args: MetadataRowArgs) {
  const { value, width, suffix: resolveSuffix } = args;
  const prefix = metadataPrefix(args);
  const base = `${prefix}${value}`;
  const availableSuffixWidth = Math.max(
    0,
    width - Cli.Fmt.Text.Width.measure(`${base} `),
  );
  const suffix = resolveSuffix?.(availableSuffixWidth);
  if (suffix && Cli.Fmt.Text.Width.measure(`${base} ${suffix}`) <= width) {
    return `${base} ${suffix}`;
  }
  if (Cli.Fmt.Text.Width.measure(base) <= width) return base;

  const valueWidth = Cli.Fmt.Text.Width.fit({
    width,
    reserve: Cli.Fmt.Text.Width.measure(prefix),
    terminal: false,
  });
  return clipLine(`${prefix}${clipValue(value, valueWidth)}`.trimEnd(), width);
}

export function metadataPrefix(
  args: Pick<MetadataRowArgs, 'label' | 'indent' | 'labelWidth' | 'styledLabel'>,
) {
  const { label, indent = 0, labelWidth = 14, styledLabel = c.gray(label) } = args;
  const labelDisplayWidth = Cli.Fmt.Text.Width.measure(styledLabel);
  const gap = ' '.repeat(Math.max(1, labelWidth - labelDisplayWidth));
  return `${' '.repeat(Math.max(0, indent))}${styledLabel}${gap}`;
}

export function hashValue(hash: t.StringHash, width: number) {
  if (width <= 0) return '';
  if (Cli.Fmt.Text.Width.measure(hash) <= width) return formatHashTail(hash);
  return Cli.Fmt.Text.ellipsize(hash, width, {
    render: ({ head, ellipsis, tail }) => {
      return `${c.dim(c.gray(head))}${Cli.Fmt.omission(ellipsis)}${formatHashTail(tail)}`;
    },
  });
}

function formatHashTail(tail: string) {
  return `${c.dim(c.gray(tail.slice(0, -5)))}${c.gray(tail.slice(-5))}`;
}
