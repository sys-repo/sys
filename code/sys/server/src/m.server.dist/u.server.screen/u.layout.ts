import { c, Cli, HashFmt, Num, type t, Time } from './common.ts';

type MetadataPrefixArgs = {
  label: string;
  indent?: number;
  labelWidth?: number;
  styledLabel?: string;
};

type MetadataSuffix = {
  digest(maxWidth: number): string;
  compact(maxWidth: number): string;
  fallback(maxWidth: number): string;
};

type MetadataRowArgs = MetadataPrefixArgs & {
  value: string;
  valueUrl?: URL;
  width: number;
  suffix?: MetadataSuffix;
};

type OutputLine = {
  sequence: number;
  source: 'stdout' | 'stderr' | 'out';
  text: string;
};

const LOG = {
  compactMetadataMaxWidth: 80,
  columnGap: 2,
  rowGutter: 1,
  sourceWidth: 3,
} as const;

/** Pure Dist serve-screen frame layout. */
export const DistServeScreenLayout = {
  toString(args: t.DistServeScreen.FrameArgs) {
    const viewport = wrangle.viewport(args.viewport);
    const capacity = Math.max(0, viewport.height - wrangle.dimension(args.cursorRows));
    const sequenceWidth = 1;
    const metadataColumn = wrangle.metadataColumn(viewport.width, sequenceWidth);
    const indent = wrangle.indent(metadataColumn);
    const headerRows = wrangle.applicationHeader(args.identity, viewport.width);
    const header = headerRows.slice(0, capacity);
    if (header.length < headerRows.length) return wrangle.renderRows(header, viewport.width);

    let available = capacity - header.length;
    const metadata = [
      wrangle.serviceUrl(args.origin, metadataColumn, viewport.width),
      `${indent}${c.green('↑')}`,
      wrangle.distRow(
        args.dir,
        args.evidence,
        args.manifestHref,
        args.renderedAt,
        metadataColumn,
        viewport.width,
      ),
      wrangle.authorityRow(args.authority, metadataColumn, viewport.width),
    ];
    const leadingGap = available >= metadata.length + 4 ? [''] : [];
    if (leadingGap.length > 0) available -= leadingGap.length;
    if (available < metadata.length) {
      return wrangle.renderRows([...header, ...leadingGap], viewport.width);
    }

    available -= metadata.length;
    const divider = wrangle.dashedDivider(viewport.width);
    const output = wrangle.outputRow(
      {
        sequence: 1,
        source: 'out',
        text: wrangle.outputText(args.authority),
      },
      viewport.width,
      sequenceWidth,
    );
    const status = ['', divider, output];
    const keyboard = args.keyboard.enabled && args.keyboard.print
      ? wrangle.keyboardRows(viewport.width, args.keyboard.navigation)
      : [];
    const footer = keyboard.length === 0
      ? []
      : [wrangle.footerDivider(viewport.width), ...keyboard];

    const tail = Cli.Screen.Dock.bottom({
      capacity: available,
      flow: available >= status.length
        ? status
        : available === 2
        ? ['', divider]
        : available === 1
        ? [divider]
        : [],
      ...(footer.length === 0 ? {} : { footer }),
    });

    return wrangle.renderRows(
      [...header, ...leadingGap, ...metadata, ...tail],
      viewport.width,
    );
  },
} as const;

/**
 * Helpers:
 */
const wrangle = {
  viewport(input: t.Cli.Screen.Size): t.Cli.Screen.Size {
    return {
      width: wrangle.dimension(input.width),
      height: wrangle.dimension(input.height),
    };
  },

  dimension(input: number) {
    return Num.Is.finite(input) ? Math.max(0, Math.floor(input)) : 0;
  },

  applicationHeader(identity: t.Cli.Fmt.Header.PackageIdentity | undefined, width: number) {
    if (!identity) return [];
    return Cli.Fmt.Header.rows({ pkg: identity, width, tone: 'green' });
  },

  indent(width: number) {
    return ' '.repeat(Math.max(0, width));
  },

  sourceColumn(sequenceWidth: number) {
    return LOG.rowGutter + Math.max(1, sequenceWidth) + LOG.columnGap;
  },

  contentColumn(sequenceWidth: number) {
    return wrangle.sourceColumn(sequenceWidth) + LOG.sourceWidth + LOG.columnGap;
  },

  metadataColumn(width: number, sequenceWidth: number) {
    const source = wrangle.sourceColumn(sequenceWidth);
    const content = wrangle.contentColumn(sequenceWidth);
    const transition = Math.max(0, wrangle.dimension(width) - LOG.compactMetadataMaxWidth);
    return Math.min(content, source + transition);
  },

  serviceUrl(href: t.StringUrl, column: number, width: number) {
    const [part] = Cli.Fmt.ServiceUrl.parts([{ href }]);
    const valueWidth = Cli.Fmt.Text.Width.fit({ width, reserve: column, terminal: false });
    return `${wrangle.indent(column)}${part ? clipServiceUrl(part, valueWidth) : ''}`;
  },

  distRow(
    dir: t.StringDir,
    evidence: t.FsPkg.Dist.Verify.Evidence,
    manifestHref: URL | undefined,
    renderedAt: t.UnixTimestamp,
    column: number,
    width: number,
  ) {
    const directory = wrangle.staticDir(dir, manifestHref);
    const hash = evidence.dist.hash?.digest;
    const age = wrangle.ageText(evidence.dist.build?.time, renderedAt);
    return metadataRow({
      label: 'static',
      value: directory.label,
      valueUrl: directory.directoryUrl,
      width,
      indent: column,
      labelWidth: 9,
      styledLabel: c.green('static'),
      suffix: wrangle.digestSuffix(hash, manifestHref, age),
    });
  },

  staticDir(dir: t.StringDir, manifestHref: URL | undefined) {
    const label = metadataValue(dir);
    const directoryUrl = manifestHref ? new URL('./', manifestHref) : undefined;
    return { label, directoryUrl } as const;
  },

  digestSuffix(
    hash: t.StringHash | undefined,
    manifestHref: URL | undefined,
    age: string | undefined,
  ): MetadataSuffix {
    const elapsed = age ? c.dim(c.gray(`· ${age}`)) : '';
    const arrow = c.green('←');
    const digests: string[] = [];
    let maxDigestWidth = Cli.Fmt.Text.Width.measure(HashFmt.digest(hash));

    while (hash && maxDigestWidth > 0) {
      const digest = HashFmt.digest(hash, { maxWidth: maxDigestWidth });
      if (!digest) break;
      const linked = manifestHref ? Cli.Fmt.hyperlink(digest, manifestHref) : digest;
      digests.push(`${arrow} ${linked}${elapsed ? ` ${elapsed}` : ''}`);
      maxDigestWidth = Cli.Fmt.Text.Width.measure(digest) - 1;
    }

    const fit = (candidates: readonly string[], maxWidth: number) => {
      const width = wrangle.dimension(maxWidth);
      return candidates.find((candidate) => Cli.Fmt.Text.Width.measure(candidate) <= width) ?? '';
    };
    const fallback = (maxWidth: number) => fit(elapsed ? [elapsed] : [], maxWidth);

    return {
      digest: (maxWidth) => fit(digests, maxWidth),
      compact: (maxWidth) => fit(digests.length > 0 ? [digests.at(-1) ?? ''] : [], maxWidth),
      fallback,
    };
  },

  authorityRow(
    authority: t.DistServer.Started['authority'],
    column: number,
    width: number,
  ) {
    const value = authority.kind === 'pinned'
      ? `pinned ${authority.integrity}`
      : `local ${c.dim(c.gray('·'))} ${c.magenta(c.bold('UNPINNED'))}`;
    return metadataRow({
      label: 'authority',
      value,
      width,
      indent: column,
      labelWidth: 9,
      styledLabel: c.white('authority'),
    });
  },

  outputText(authority: t.DistServer.Started['authority']) {
    return authority.kind === 'pinned'
      ? 'serving pinned Dist on HTTP server…'
      : 'serving locally verified Dist (UNPINNED) on HTTP server…';
  },

  outputRow(line: OutputLine, width: number, sequenceWidth: number) {
    const rowWidth = Math.max(0, Math.floor(width) - LOG.rowGutter);
    const source = line.source === 'stderr' ? c.yellow('err') : c.gray('out');
    const gap = wrangle.indent(LOG.columnGap);
    const prefix = `${wrangle.indent(LOG.rowGutter)}${
      c.gray(String(line.sequence).padStart(sequenceWidth, ' '))
    }${gap}${source}${gap}`;
    const textWidth = Cli.Fmt.Text.Width.fit({
      width: rowWidth,
      reserve: Cli.Fmt.Text.Width.measure(prefix),
      terminal: false,
    });
    const text = clipColored(Cli.stripAnsi(line.text).trim(), textWidth, c.white);
    return clipLine(`${prefix}${text}`, rowWidth);
  },

  keyboardRows(width: number, navigation: t.DistServeScreen.Navigation | undefined) {
    const quit = Cli.Fmt.Keyboard.command({ label: 'quit', keys: ['q'] });
    const openBrowser = Cli.Fmt.Keyboard.command({
      label: 'open',
      keys: ['o'],
      context: 'browser',
    });
    const open = Cli.Fmt.Keyboard.command({ label: 'open', keys: ['o'] });

    if (navigation === 'nested') {
      const back = Cli.Fmt.Keyboard.back();
      const row = Cli.Fmt.Keyboard.row({
        width,
        candidates: [
          { left: `${back}  ${openBrowser}`, right: quit },
          { left: `${back}  ${open}`, right: quit },
          { left: back, right: quit },
        ],
      });
      return row ? [row] : [];
    }

    const row = Cli.Fmt.Keyboard.row({
      width,
      candidates: [{ left: openBrowser, right: quit }, { left: open, right: quit }],
    });
    return row ? [row] : [];
  },

  ageText(value: t.UnixTimestamp | undefined, renderedAt: t.UnixTimestamp) {
    if (!Num.Is.finite(value)) return undefined;
    try {
      return Time.elapsed(value, renderedAt).toString();
    } catch {
      return undefined;
    }
  },

  dashedDivider(width: number) {
    return c.dim(Cli.Fmt.hr({ width, color: 'green', weight: 'dashed' }));
  },

  footerDivider(width: number) {
    return c.dim(c.gray(Cli.Fmt.hr({ width, weight: 'dashed' })));
  },

  renderRows(rows: string[], width: number) {
    if (width === 0 || rows.length === 0) return '';
    return rows.map((line) => clipLine(line, width)).join('\n').trimEnd();
  },
} as const;

/**
 * Utilities:
 */
function metadataRow(args: MetadataRowArgs) {
  const { value, valueUrl, width, suffix } = args;
  const prefix = metadataPrefix(args);
  const base = `${prefix}${formatMetadataValue(value, valueUrl)}`;
  const baseSuffixWidth = Math.max(0, width - Cli.Fmt.Text.Width.measure(`${base} `));
  const digest = suffix?.digest(baseSuffixWidth);
  if (digest && Cli.Fmt.Text.Width.measure(`${base} ${digest}`) <= width) {
    return `${base} ${digest}`;
  }

  const compactSuffixWidth = Math.max(
    0,
    width - Cli.Fmt.Text.Width.measure(`${prefix}… `),
  );
  const compactDigest = suffix?.compact(compactSuffixWidth);
  if (compactDigest) return compactMetadataRow(prefix, value, valueUrl, compactDigest, width);

  const fallback = suffix?.fallback(baseSuffixWidth);
  if (fallback && Cli.Fmt.Text.Width.measure(`${base} ${fallback}`) <= width) {
    return `${base} ${fallback}`;
  }

  const compactFallback = suffix?.fallback(compactSuffixWidth);
  if (compactFallback) return compactMetadataRow(prefix, value, valueUrl, compactFallback, width);
  if (Cli.Fmt.Text.Width.measure(base) <= width) return base;

  const valueWidth = Cli.Fmt.Text.Width.fit({
    width,
    reserve: Cli.Fmt.Text.Width.measure(prefix),
    terminal: false,
  });
  const clipped = formatMetadataValue(clipValue(value, valueWidth), valueUrl);
  return clipLine(`${prefix}${clipped}`.trimEnd(), width);
}

function compactMetadataRow(
  prefix: string,
  value: string,
  valueUrl: URL | undefined,
  suffix: string,
  width: number,
) {
  const valueWidth = Cli.Fmt.Text.Width.fit({
    width,
    reserve: Cli.Fmt.Text.Width.measure(`${prefix} ${suffix}`),
    terminal: false,
  });
  const clipped = formatMetadataValue(clipValue(value, valueWidth), valueUrl);
  return `${prefix}${clipped} ${suffix}`;
}

function formatMetadataValue(value: string, url: URL | undefined) {
  return value && url ? Cli.Fmt.hyperlink(value, url) : value;
}

function metadataPrefix(args: MetadataPrefixArgs) {
  const {
    label,
    indent = 0,
    labelWidth = 14,
    styledLabel = c.gray(label),
  } = args;
  const labelDisplayWidth = Cli.Fmt.Text.Width.measure(styledLabel);
  const gap = ' '.repeat(Math.max(2, labelWidth - labelDisplayWidth + 2));
  return `${' '.repeat(Math.max(0, indent))}${styledLabel}${gap}`;
}

function metadataValue(input: t.StringDir) {
  if (!input) return './';
  return input.endsWith('/') ? input : `${input}/`;
}

function clipLine(input: string, width: number) {
  if (width <= 0) return '';
  const plain = Cli.stripAnsi(input);
  if (Cli.Fmt.Text.Width.measure(plain) <= width) return input;
  return Cli.Fmt.Text.ellipsize(plain, width, {
    render: ({ head, ellipsis, tail }) => {
      return `${c.gray(head)}${Cli.Fmt.omission(ellipsis)}${c.gray(tail)}`;
    },
  });
}

function clipValue(input: string, width: number) {
  if (width <= 0) return '';
  const plain = Cli.stripAnsi(input);
  if (Cli.Fmt.Text.Width.measure(plain) <= width) return input;
  return Cli.Fmt.Text.ellipsize(plain, width, {
    render: ({ head, ellipsis, tail }) => `${head}${Cli.Fmt.omission(ellipsis)}${tail}`,
  });
}

function clipServiceUrl(part: t.Cli.Fmt.ServiceUrl.Part, width: number) {
  if (width <= 0) return '';
  if (Cli.Fmt.Text.Width.measure(part.display) <= width) return Cli.Fmt.ServiceUrl.format(part);
  return Cli.Fmt.Text.ellipsize(part.display, width, {
    render: ({ head, ellipsis, tail }) => {
      const tailStart = part.display.length - tail.length;
      return `${formatServiceUrlFragment(part, head, 0)}${Cli.Fmt.omission(ellipsis)}${
        formatServiceUrlFragment(part, tail, tailStart)
      }`;
    },
  });
}

function formatServiceUrlFragment(part: t.Cli.Fmt.ServiceUrl.Part, text: string, offset: number) {
  const originEnd = part.origin.length;
  const portStart = part.port ? originEnd - part.port.length : originEnd;
  const origin = part.highlightOrigin ? c.cyan : c.gray;
  const port = part.highlightOrigin ? (value: string) => c.bold(c.cyan(value)) : c.gray;
  const suffix = part.highlightOrigin && part.suffix === '/' ? c.cyan : c.gray;
  return [
    formatServiceUrlRange(text, offset, 0, portStart, origin),
    formatServiceUrlRange(text, offset, portStart, originEnd, port),
    formatServiceUrlRange(text, offset, originEnd, part.display.length, suffix),
  ].join('');
}

function formatServiceUrlRange(
  text: string,
  offset: number,
  start: number,
  end: number,
  color: (value: string) => string,
) {
  const from = Math.max(offset, start);
  const to = Math.min(offset + text.length, end);
  return from >= to ? '' : color(text.slice(from - offset, to - offset));
}

function clipColored(input: string, width: number, color: (text: string) => string) {
  if (width <= 0) return '';
  if (Cli.Fmt.Text.Width.measure(input) <= width) return color(input);
  return Cli.Fmt.Text.ellipsize(input, width, {
    render({ head, ellipsis, tail }) {
      return `${color(head)}${Cli.Fmt.omission(ellipsis)}${color(tail)}`;
    },
  });
}
