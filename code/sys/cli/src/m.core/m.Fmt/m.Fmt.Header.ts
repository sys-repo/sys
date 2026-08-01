import { c, Color, Is, Num, stripAnsi, type t } from '../common.ts';
import { Text } from '../m.Fmt.Text/mod.ts';
import { hr } from './m.Fmt.Hr.ts';

const DEFAULT_TITLE = 'Untitled';
const TITLE_SEPARATOR = ' · ';

/**
 * Application identity header formatter.
 */
export const Header: t.CliFormatHeader.Lib = { rows };

/**
 * Helpers:
 */
function rows(options: t.CliFormatHeader.Options): readonly string[] {
  const width = resolveWidth(options.width);
  if (width === 0) return Object.freeze([]);

  const headline = renderHeadline(options, width);
  const output = [headline];
  if (options.hr !== false) output.push(renderHr(options, width));
  return Object.freeze(output);
}

function renderHeadline(options: t.CliFormatHeader.Options, width: number): string {
  const packageName = normalizeText(options.pkg?.name);
  const customTitle = normalizeTitle(options.title);
  const generatedName = packageName || DEFAULT_TITLE;
  const compactName = packageName ? unscopedName(packageName) : generatedName;
  const generatedTitle = renderTitle(generatedName, options.tone);
  const compactTitle = renderTitle(compactName, options.tone);
  const titles = customTitle
    ? [customTitle]
    : packageName
    ? [generatedTitle, compactTitle]
    : [generatedTitle];
  const detail = normalizeText(options.detail);
  const version = options.version === false
    ? ''
    : normalizeText(options.version ?? options.pkg?.version);
  const rightLanes = renderRightLanes(detail, version, options.tone);

  for (const right of rightLanes) {
    for (const title of titles) {
      const candidate = renderSplit(title, right, width);
      if (candidate !== undefined) return candidate;
    }
  }

  for (const title of titles) {
    if (Text.Width.measure(title) <= width) return title;
  }

  const plainTitle = customTitle ? stripAnsi(customTitle).trim() : compactName;
  const plain = Text.ellipsize(plainTitle, width);
  return renderTitle(plain, options.tone);
}

function renderRightLanes(
  detail: string,
  version: string,
  tone?: t.AnsiColor.Name,
): readonly string[] {
  const detailText = applyTone(detail, tone);
  const versionText = c.dim(applyTone(version, tone));

  if (detail && version) {
    const separator = c.dim(applyTone(TITLE_SEPARATOR, tone));
    return [`${detailText}${separator}${versionText}`, versionText];
  }
  if (detail) return [detailText];
  if (version) return [versionText];
  return [];
}

function renderSplit(title: string, right: string, width: number): string | undefined {
  const gap = width - Text.Width.measure(title) - Text.Width.measure(right);
  return gap >= 1 ? `${title}${' '.repeat(gap)}${right}` : undefined;
}

function renderTitle(plain: string, tone?: t.AnsiColor.Name): string {
  return c.bold(applyTone(plain, tone));
}

function renderHr(options: t.CliFormatHeader.Options, width: number): string {
  const override = options.hr || undefined;
  const color = override?.color ?? options.tone;
  const weight = override?.weight;
  return hr({
    width,
    ...(color ? { color } : {}),
    ...(weight ? { weight } : {}),
  });
}

function resolveWidth(input?: number): number {
  if (input === undefined) return Text.Width.fit();
  if (!Num.Is.finite(input) || input <= 0) return 0;
  return Math.floor(input);
}

function normalizeTitle(input?: string): string | undefined {
  const value = normalizeText(input);
  return stripAnsi(value).trim() ? value : undefined;
}

function normalizeText(input?: unknown): string {
  return Is.string(input) ? input.trim() : '';
}

function unscopedName(name: string): string {
  const index = name.lastIndexOf('/');
  const value = index >= 0 ? name.slice(index + 1) : name;
  return value || name || 'unknown';
}

function applyTone(text: string, tone?: t.AnsiColor.Name): string {
  return tone ? Color.foreground[tone](text) : text;
}
