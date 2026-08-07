import { c, Cli } from '@sys/cli';
import { HashFmt } from '@sys/crypto/fmt';
import { Num, type t, Time } from '../common.ts';

type FailureChannel = {
  readonly promise: Promise<never>;
  reject(cause: unknown): void;
};

type ResizeSubscription = { unsubscribe(): void };

type ScreenSize = t.Cli.Screen.Size;

type Reporter = {
  readonly failure: Promise<never>;
  readonly dispose: () => void;
};

type Terminal = {
  readonly cursorRows: number;
  size(): ScreenSize;
  events(until?: t.UntilInput): t.Cli.Screen.Events;
  repaint(frame: string): void;
};

type FrameArgs = {
  readonly pkg: t.Pkg | undefined;
  readonly origin: t.StringUrl;
  readonly dir: t.StringDir;
  readonly authority: t.DistServer.Started['authority'];
  readonly evidence: t.FsPkg.Dist.Verify.Evidence;
  readonly renderedAt: t.UnixTimestamp;
  readonly viewport: ScreenSize;
  readonly cursorRows: number;
  readonly keyboard: {
    readonly enabled: boolean;
    readonly print: boolean;
  };
};

type RuntimeCreateArgs = {
  readonly pkg?: t.Pkg;
  readonly origin: t.StringUrl;
  readonly dir: t.StringDir;
  readonly authority: t.DistServer.Started['authority'];
  readonly evidence: t.FsPkg.Dist.Verify.Evidence;
  readonly renderedAt: t.UnixTimestamp;
  readonly keyboard?: {
    readonly enabled: boolean;
    readonly print: boolean;
  };
  readonly until?: t.UntilInput;
  readonly terminal?: Partial<Terminal>;
};

const LOG = {
  compactMetadataMaxWidth: 80,
  columnGap: 2,
  rowGutter: 1,
  sourceWidth: 3,
} as const;

const DISPOSED_REPORTER = Object.freeze(
  {
    failure: new Promise<never>(() => {}),
    dispose() {},
  } satisfies Reporter,
);

const DEFAULT_TERMINAL = Object.freeze(
  {
    cursorRows: 1,
    size: () => Cli.Screen.size(),
    events: (until?: t.UntilInput) => Cli.Screen.events(until),
    repaint: (frame: string) => Cli.Screen.repaint(frame),
  } satisfies Terminal,
);

/**
 * Dist terminal screen layout for terminal-owned `serve` workflows.
 */
export const DistServeScreen = {
  toString(args: FrameArgs) {
    const viewport = wrangle.viewport(args.viewport);
    const capacity = Math.max(0, viewport.height - wrangle.dimension(args.cursorRows));
    const sequenceWidth = 1;
    const metadataColumn = wrangle.metadataColumn(viewport.width, sequenceWidth);
    const indent = wrangle.indent(metadataColumn);
    const headerRows = wrangle.applicationHeader(args.pkg, viewport.width);
    const header = headerRows.slice(0, capacity);
    if (header.length < headerRows.length) return wrangle.renderRows(header, viewport.width);

    let available = capacity - header.length;
    const metadata = [
      wrangle.serviceUrl(args.origin, metadataColumn, viewport.width),
      `${indent}${c.green('↑')}`,
      wrangle.distRow(args.dir, args.evidence, args.renderedAt, metadataColumn, viewport.width),
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
      ? wrangle.keyboardRows(viewport.width)
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

  create(args: RuntimeCreateArgs): Reporter {
    const terminal = { ...DEFAULT_TERMINAL, ...args.terminal };
    const events = terminal.events(args.until);
    if (events.disposed) return DISPOSED_REPORTER;

    const failed = wrangle.failureChannel();
    let disposed = false;
    let acquired = false;
    let observed = false;
    let viewport: ScreenSize = { width: 0, height: 0 };
    let subscription: ResizeSubscription | undefined;

    const repaint = () => {
      terminal.repaint(
        DistServeScreen.toString({
          pkg: args.pkg,
          origin: args.origin,
          dir: args.dir,
          authority: args.authority,
          evidence: args.evidence,
          renderedAt: args.renderedAt,
          viewport,
          cursorRows: terminal.cursorRows,
          keyboard: {
            enabled: args.keyboard?.enabled ?? false,
            print: args.keyboard?.print ?? false,
          },
        }),
      );
    };

    const release = () => {
      if (disposed) return;
      disposed = true;
      const current = subscription;
      subscription = undefined;
      wrangle.cleanup([
        () => current?.unsubscribe(),
        () => events.dispose(),
      ]);
    };

    const fail = (cause: unknown) => {
      if (disposed) return;
      try {
        release();
      } catch {
        // Preserve the original presentation failure.
      }
      failed.reject(cause);
    };

    try {
      subscription = events.resize$.subscribe((event) => {
        if (disposed) return;
        viewport = wrangle.viewport(event.after);
        observed = true;
        if (!acquired) return;
        try {
          repaint();
        } catch (error) {
          fail(error);
        }
      });
      if (!observed) {
        const initial = wrangle.viewport(terminal.size());
        if (!observed) {
          viewport = initial;
          observed = true;
        }
      }
      repaint();
      acquired = true;
    } catch (error) {
      try {
        release();
      } catch {
        // Preserve the acquisition or initial-render failure.
      }
      throw error;
    }

    return { failure: failed.promise, dispose: release };
  },
} as const;

/**
 * Helpers:
 */
const wrangle = {
  failureChannel(): FailureChannel {
    let reject: (cause: unknown) => void = () => {};
    const promise = new Promise<never>((_, rejectPromise) => {
      reject = rejectPromise;
    });
    return { promise, reject };
  },

  viewport(input: ScreenSize): ScreenSize {
    return {
      width: wrangle.dimension(input.width),
      height: wrangle.dimension(input.height),
    };
  },

  dimension(input: number) {
    return Num.Is.finite(input) ? Math.max(0, Math.floor(input)) : 0;
  },

  headerTitle(pkg: t.Pkg | undefined) {
    if (!pkg?.name) return undefined;
    const name = pkg.name;
    const firstSlash = name.indexOf('/');
    const subpathAt = name.startsWith('@') ? name.indexOf('/', firstSlash + 1) : firstSlash;
    if (subpathAt < 0) return;
    const packageName = name.slice(0, subpathAt);
    const subpath = name.slice(subpathAt);
    return `${c.bold(c.green(packageName))}${c.dim(c.green(subpath))}`;
  },

  applicationHeader(pkg: t.Pkg | undefined, width: number) {
    const title = wrangle.headerTitle(pkg);
    if (!pkg) return [];
    return Cli.Fmt.Header.rows({
      pkg,
      width,
      tone: 'green',
      ...(title ? { title } : {}),
    });
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
    return width <= LOG.compactMetadataMaxWidth
      ? wrangle.sourceColumn(sequenceWidth)
      : wrangle.contentColumn(sequenceWidth);
  },

  serviceUrl(href: t.StringUrl, column: number, width: number) {
    const source = Cli.Fmt.Url.service({ href }, { highlightOrigin: true });
    const valueWidth = Cli.Fmt.Text.Width.fit({ width, reserve: column, terminal: false });
    return `${wrangle.indent(column)}${clipText(source, valueWidth)}`;
  },

  distRow(
    dir: t.StringDir,
    evidence: t.FsPkg.Dist.Verify.Evidence,
    renderedAt: t.UnixTimestamp,
    column: number,
    width: number,
  ) {
    const value = metadataValue(dir);
    const hash = evidence.dist.hash?.digest;
    const age = wrangle.ageText(evidence.dist.build?.time, renderedAt);
    return metadataRow({
      label: 'static',
      value,
      width,
      indent: column,
      labelWidth: 9,
      styledLabel: c.green('static'),
      suffix: wrangle.digestSuffix(hash, age),
    });
  },

  digestSuffix(hash: t.StringHash | undefined, age: string | undefined) {
    const elapsed = age ? c.dim(c.gray(`· ${age}`)) : '';
    const arrow = c.green('←');
    const reserve = Cli.Fmt.Text.Width.measure(`${arrow}${elapsed ? `  ${elapsed}` : ' '}`);
    return (maxWidth: number) => {
      if (!hash) return elapsed;
      const digest = HashFmt.digest(hash, { maxWidth: Math.max(0, maxWidth - reserve) });
      if (!digest) return elapsed;
      return `${arrow} ${digest}${elapsed ? ` ${elapsed}` : ''}`;
    };
  },

  authorityRow(
    authority: t.DistServer.Started['authority'],
    column: number,
    width: number,
  ) {
    const value = authority.kind === 'pinned'
      ? `pinned ${authority.integrity}`
      : `local ${c.dim(c.gray('·'))} ${c.yellow(c.bold('UNPINNED'))}`;
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
      : `serving locally verified Dist (${c.yellow(c.bold('UNPINNED'))}) on HTTP server…`;
  },

  outputRow(
    line: {
      readonly sequence: number;
      readonly source: 'stdout' | 'stderr' | 'out';
      readonly text: string;
    },
    width: number,
    sequenceWidth: number,
  ) {
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
    const text = clipValue(line.text, textWidth);
    return clipLine(`${prefix}${text}`, rowWidth);
  },

  keyboardRows(width: number) {
    const key = (text: string) => c.bold(c.white(text));
    const open = `${c.dim(c.gray('open:'))} ${key('o')} ${c.dim(c.gray('(in browser)'))}`;
    const quit = `${c.dim(c.gray('quit:'))} ${key('ctrl + c')} ${c.dim(c.gray('or'))} ${key('q')}`;
    const controlsWidth = Cli.Fmt.Text.Width.measure(`${open}  ${quit}`);
    if (controlsWidth > width) return [];

    const gap = ' '.repeat(
      Math.max(2, width - Cli.Fmt.Text.Width.measure(open) - Cli.Fmt.Text.Width.measure(quit)),
    );
    return [`${open}${gap}${quit}`];
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

  cleanup(actions: readonly (() => void)[]): void {
    let hasFailure = false;
    let failure: unknown;
    for (const action of actions) {
      try {
        action();
      } catch (error) {
        if (hasFailure) continue;
        failure = error;
        hasFailure = true;
      }
    }
    if (hasFailure) throw failure;
  },
} as const;

/**
 * Utilities:
 */
type MetadataRowArgs = {
  readonly label: string;
  readonly value: string;
  readonly width: number;
  readonly indent?: number;
  readonly labelWidth?: number;
  readonly styledLabel?: string;
  readonly suffix?: (maxWidth: number) => string;
};

function metadataRow(args: MetadataRowArgs) {
  const { value, width, suffix: resolveSuffix } = args;
  const prefix = metadataPrefix(args);
  const base = `${prefix}${value}`;
  const suffix = resolveSuffix?.(Math.max(0, width - Cli.Fmt.Text.Width.measure(`${base} `)));
  if (suffix && Cli.Fmt.Text.Width.measure(`${base} ${suffix}`) <= width) {
    return `${base} ${suffix}`;
  }

  const compactSuffix = resolveSuffix?.(
    Math.max(0, width - Cli.Fmt.Text.Width.measure(`${prefix}… `)),
  );
  if (compactSuffix && Cli.Fmt.Text.Width.measure(`${prefix}… ${compactSuffix}`) <= width) {
    const valueWidth = Cli.Fmt.Text.Width.fit({
      width,
      reserve: Cli.Fmt.Text.Width.measure(`${prefix} ${compactSuffix}`),
      terminal: false,
    });
    return `${prefix}${clipValue(value, valueWidth)} ${compactSuffix}`;
  }

  if (Cli.Fmt.Text.Width.measure(base) <= width) return base;

  const valueWidth = Cli.Fmt.Text.Width.fit({
    width,
    reserve: Cli.Fmt.Text.Width.measure(prefix),
    terminal: false,
  });
  return clipLine(`${prefix}${clipValue(value, valueWidth)}`.trimEnd(), width);
}

function metadataPrefix(
  args: Pick<MetadataRowArgs, 'label' | 'indent' | 'labelWidth' | 'styledLabel'>,
) {
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
  return c.gray(clipText(plain, width));
}

function clipText(input: string, width: number) {
  if (width <= 0) return '';
  return Cli.Fmt.Text.ellipsize(input, width);
}

function clipValue(input: string, width: number) {
  if (width <= 0) return '';
  const plain = Cli.stripAnsi(input);
  if (Cli.Fmt.Text.Width.measure(plain) <= width) return input;
  return Cli.Fmt.Text.ellipsize(plain, width, {
    render: ({ head, ellipsis, tail }) => `${head}${c.gray(ellipsis)}${tail}`,
  });
}
