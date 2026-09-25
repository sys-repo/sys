import { clipLine, clipText, digest } from '../../m.fmt/u.ts';
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
  applicationHeader(identity: t.Cli.Fmt.Header.PackageIdentity, width: number) {
    return Cli.Fmt.Header.rows({ pkg: identity, width, tone: 'green' });
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
    const source = Cli.Fmt.ServiceUrl.format(
      { href: href as t.StringUrl },
      { origin: 'highlight' },
    );
    const valueWidth = Cli.Fmt.Text.Width.fit({ width, reserve: column, terminal: false });
    const indent = ViteScreenLayout.indent(column);
    return `${indent}${clipText(source, valueWidth)}`;
  },

  distSuffix(
    dist: t.DistPkg | undefined,
    manifestUrl: URL | undefined,
    renderedAt: t.UnixTimestamp,
  ) {
    return (maxWidth: number) => {
      if (!dist) return '';
      const age = c.dim(c.gray(`· ${Time.elapsed(dist.build.time, renderedAt)}`));
      const reserve = Cli.Fmt.Text.Width.measure(` ${age}`);
      const value = digest(dist.hash.digest, {
        maxWidth: Math.max(0, maxWidth - reserve),
        url: manifestUrl,
      });
      return value ? `${value} ${age}` : '';
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
    const text = c.white(clipText(stripAnsi(line.text).trim(), textWidth));
    return clipLine(`${prefix}${text}`, rowWidth);
  },
} as const;
