import { c, Cli, HashFmt, Is, stripAnsi, type t, Time } from './common.ts';

const MINUTE = 60_000;

type MetadataRowArgs = {
  label: string;
  value: string;
  width: number;
  indent?: number;
  labelWidth?: number;
  styledLabel?: string;
  suffixes?: string[];
};

export const digest: t.ViteLog.Lib['digest'] = (hash?: t.StringHash) => {
  if (!hash) return '';
  const uri = HashFmt.digest(hash);
  return `${c.green('←')} ${uri}`;
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
  return c.gray(clipText(stripAnsi(input), width));
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
    render: ({ head, ellipsis, tail }) => `${head}${c.gray(ellipsis)}${tail}`,
  });
}

export function metadataRow(args: MetadataRowArgs) {
  const { value, width, suffixes = [] } = args;
  const prefix = metadataPrefix(args);
  const base = `${prefix}${value}`;
  const suffix = suffixes.find((candidate) => {
    return Cli.Fmt.Text.Width.measure(`${base} ${candidate}`) <= width;
  });
  if (suffix) return `${base} ${suffix}`;
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

export function digestSuffixes(hash?: t.StringHash) {
  if (!hash) return [];
  const parts = digestParts(hash);
  const compact = parts
    ? [
      styledDigest(`${parts.algorithm}:${parts.suffix}`),
      styledDigest(parts.suffix),
    ]
    : [];
  return [digest(hash), ...compact];
}

export function styledDigest(value: string) {
  const hashIndex = value.lastIndexOf('#');
  const body = hashIndex >= 0
    ? `${c.gray(value.slice(0, hashIndex))}${c.green(value.slice(hashIndex))}`
    : c.gray(value);
  return `${c.green('←')} ${body}`;
}

export function hashValue(hash: t.StringHash, width: number) {
  const text = clipText(hash, width);
  if (!text) return '';
  return `${c.dim(c.gray(text.slice(0, -5)))}${c.gray(text.slice(-5))}`;
}

export function digestParts(hash: t.StringHash) {
  const uri = stripAnsi(HashFmt.digest(hash)).trim();
  const uriParts = uri.split(':');
  if (uriParts.length >= 3 && uriParts[0] === 'digest') {
    return { algorithm: uriParts[1], suffix: uriParts.slice(2).join(':') };
  }

  const index = hash.indexOf('-');
  if (index <= 0) return undefined;
  return { algorithm: hash.slice(0, index), suffix: `#${hash.slice(-5)}` };
}
