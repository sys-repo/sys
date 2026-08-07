import { HashFmt } from '@sys/crypto/fmt';
import { clipLine, clipText, clipValue } from '../../m.fmt/u.ts';
import { c, Cli, stripAnsi, type t, Time } from '../common.ts';

type OutputLine = t.ViteScreen.Output.Line;

const LOG = {
  compactMetadataMaxWidth: 80,
  columnGap: 2,
  rowGutter: 1,
  sourceWidth: 3,
} as const;

/** Private Vite terminal-layout grammar for the dev screen. */
export const ViteScreenLayout = {
  applicationHeader(pkg: t.Pkg, width: number) {
    const title = wrangle.packageTitle(pkg.name);
    return Cli.Fmt.Header.rows({ pkg, width, tone: 'green', ...(title ? { title } : {}) });
  },

  sourceColumn(sequenceWidth: number) {
    return LOG.rowGutter + Math.max(1, sequenceWidth) + LOG.columnGap;
  },

  contentColumn(sequenceWidth: number) {
    return ViteScreenLayout.sourceColumn(sequenceWidth) + LOG.sourceWidth + LOG.columnGap;
  },

  metadataColumn(width: number, sequenceWidth: number) {
    return width <= LOG.compactMetadataMaxWidth
      ? ViteScreenLayout.sourceColumn(sequenceWidth)
      : ViteScreenLayout.contentColumn(sequenceWidth);
  },

  indent(width: number) {
    return ' '.repeat(Math.max(0, width));
  },

  serviceUrl(href: string, column: number, width: number) {
    const parts = Cli.Fmt.Url.parts({ href: href as t.StringUrl });
    const text = parts.display;
    const valueWidth = Cli.Fmt.Text.Width.fit({ width, reserve: column, terminal: false });
    const indent = ViteScreenLayout.indent(column);
    if (Cli.Fmt.Text.Width.measure(text) > valueWidth) {
      return `${indent}${c.cyan(clipText(text, valueWidth))}`;
    }

    if (!parts.port) return c.cyan(`${indent}${text}`);
    const origin = parts.origin.slice(0, -parts.port.length);
    const port = c.bold(c.brightCyan(parts.port));
    return c.cyan(`${indent}${origin}${port}${parts.suffix}`);
  },

  distSuffix(dist: t.DistPkg | undefined, renderedAt: t.UnixTimestamp) {
    return (maxWidth: number) => {
      if (!dist) return '';
      const age = c.dim(c.gray(`· ${Time.elapsed(dist.build.time, renderedAt)}`));
      const arrow = c.green('←');
      const reserve = Cli.Fmt.Text.Width.measure(`${arrow}  ${age}`);
      const digest = HashFmt.digest(dist.hash.digest, {
        maxWidth: Math.max(0, maxWidth - reserve),
      });
      return digest ? `${arrow} ${digest} ${age}` : '';
    };
  },

  dashedDivider(width: number) {
    return c.dim(Cli.Fmt.hr({ width, color: 'green', weight: 'dashed' }));
  },

  renderRows(rows: string[], width: number) {
    if (width === 0 || rows.length === 0) return '';
    return rows.map((line) => clipLine(line, width)).join('\n').trimEnd();
  },

  outputSequenceWidth(lines: OutputLine[]) {
    return Math.max(1, ...lines.map((line) => String(line.sequence).length));
  },

  outputRow(line: OutputLine, width: number, sequenceWidth: number) {
    const rowWidth = Math.max(0, Math.floor(width) - LOG.rowGutter);
    const sequence = c.gray(String(line.sequence).padStart(sequenceWidth, ' '));
    const source = line.source === 'stderr' ? c.yellow('err') : c.gray('out');
    const gap = ViteScreenLayout.indent(LOG.columnGap);
    const prefix = `${ViteScreenLayout.indent(LOG.rowGutter)}${sequence}${gap}${source}${gap}`;
    const textWidth = Cli.Fmt.Text.Width.fit({
      width: rowWidth,
      reserve: Cli.Fmt.Text.Width.measure(prefix),
      terminal: false,
    });
    const text = clipValue(stripAnsi(line.text).trim(), textWidth);
    return clipLine(`${prefix}${text}`, rowWidth);
  },
} as const;

/**
 * Helpers:
 */
const wrangle = {
  packageTitle(name: string) {
    const firstSlash = name.indexOf('/');
    const subpathAt = name.startsWith('@') ? name.indexOf('/', firstSlash + 1) : firstSlash;
    if (subpathAt < 0) return;

    const packageName = name.slice(0, subpathAt);
    const subpath = name.slice(subpathAt);
    return `${c.bold(c.green(packageName))}${c.dim(c.green(subpath))}`;
  },
} as const;
