import { c, Cli, Fs, Num, Path, pkg, type t } from '../common.ts';

type ScreenSize = t.Cli.Screen.Size;

export type StartGuiScreenInput = {
  readonly service: string;
  readonly dir: t.StringDir;
  readonly origin: t.StringUrl;
  readonly keyboard: boolean;
};

export type StartGuiScreenInstance = {
  readonly failure: Promise<never>;
  readonly dispose: () => void;
};

export type StartGuiScreenDependencies = {
  readonly isInteractive: () => boolean;
  readonly size: () => ScreenSize;
  readonly observeResize: (handler: (size: ScreenSize) => void) => () => void;
  readonly repaint: (frame: string) => void;
};

const INERT: StartGuiScreenInstance = Object.freeze({
  failure: new Promise<never>(() => {}),
  dispose() {},
});

const DEFAULT_DEPS: StartGuiScreenDependencies = Object.freeze({
  isInteractive: () => Cli.Is.interactive(),
  size: () => Cli.Screen.size(),
  observeResize(handler) {
    const events = Cli.Screen.events();
    const subscription = events.resize$.subscribe((event) => handler(event.after));
    return () =>
      runCleanup([
        () => subscription.unsubscribe(),
        () => events.dispose(),
      ]);
  },
  repaint: (frame) => Cli.Screen.repaint(frame),
});

/** Responsive terminal owner for the direct Pi GUI host. */
export const StartGuiScreen = {
  create(
    input: StartGuiScreenInput,
    overrides: Partial<StartGuiScreenDependencies> = {},
  ): StartGuiScreenInstance {
    const deps = { ...DEFAULT_DEPS, ...overrides };
    if (!deps.isInteractive()) return INERT;

    let disposed = false;
    let acquired = false;
    let observed = false;
    let viewport: ScreenSize = { width: 0, height: 0 };
    let releaseResize: (() => void) | undefined;
    let rejectFailure!: (cause: unknown) => void;
    const failure = new Promise<never>((_resolve, reject) => {
      rejectFailure = reject;
    });

    const release = () => {
      if (disposed) return;
      disposed = true;
      const current = releaseResize;
      releaseResize = undefined;
      current?.();
    };
    const repaint = () => deps.repaint(StartGuiScreen.toString({ ...input, viewport }));
    const fail = (cause: unknown) => {
      if (disposed) return;
      try {
        release();
      } catch {
        // Preserve the repaint failure.
      }
      rejectFailure(cause);
    };

    try {
      releaseResize = deps.observeResize((size) => {
        if (disposed) return;
        viewport = normalizeSize(size);
        observed = true;
        if (!acquired) return;
        try {
          repaint();
        } catch (cause) {
          fail(cause);
        }
      });
      if (!observed) {
        const initial = normalizeSize(deps.size());
        if (!observed) {
          viewport = initial;
          observed = true;
        }
      }
      repaint();
      acquired = true;
    } catch (cause) {
      try {
        release();
      } catch {
        // Preserve the acquisition failure.
      }
      throw cause;
    }

    return { failure, dispose: release };
  },

  toString(input: StartGuiScreenInput & { readonly viewport: ScreenSize }): string {
    const viewport = normalizeSize(input.viewport);
    if (viewport.width === 0 || viewport.height === 0) return '';

    const serviceWidth = Math.max(0, viewport.width - SERVICE_INSET * 2);
    const serviceRows = [
      serviceRow('service', { kind: 'title', text: input.service }, serviceWidth),
      serviceRow('url', { kind: 'url', text: input.origin }, serviceWidth),
      serviceRow('root', {
        kind: 'path',
        text: Fs.trimCwd(input.dir, { prefix: true }),
        href: Path.toFileUrl(input.dir),
      }, serviceWidth),
    ].map((row) => insetServiceRow(row, serviceWidth));
    const rows = [
      ...Cli.Fmt.Header.rows({ pkg, width: viewport.width, tone: 'green' }),
      '',
      ...serviceRows,
    ];
    const capacity = Math.max(0, viewport.height - FRAME_CURSOR_ROWS);
    const candidateControls = input.keyboard ? keyboardRows(viewport.width) : [];
    const controls = rows.length + candidateControls.length <= capacity ? candidateControls : [];
    const available = Math.max(0, capacity - controls.length);
    const visible = [...rows.slice(0, available), ...controls];
    return visible.map((row) => fitRow(row, viewport.width)).join('\n').trimEnd();
  },
} as const;

/**
 * Helpers:
 */
type ServiceValue =
  | { readonly kind: 'title' | 'url'; readonly text: string }
  | { readonly kind: 'path'; readonly text: string; readonly href: URL };

const FRAME_CURSOR_ROWS = 1;
const SERVICE_INSET = 2;

function insetServiceRow(row: string, width: number) {
  if (width === 0) return '';
  return `${' '.repeat(SERVICE_INSET)}${fitRow(row, width)}`;
}

function serviceRow(label: string, value: ServiceValue, width: number) {
  const gapWidth = 3;
  const naturalLabelWidth = 'service'.length;
  const minValueWidth = 1;
  const labelWidth = Math.min(
    naturalLabelWidth,
    Math.max(0, width - gapWidth - minValueWidth),
  );
  const gap = labelWidth + gapWidth + minValueWidth <= width ? ' '.repeat(gapWidth) : '';
  const labelText = label === 'service' ? label : ` ${label}`;
  const fittedLabel = Cli.Fmt.Text.ellipsize(labelText, labelWidth);
  const labelColor = label === 'service' ? c.green : fieldLabelColor;
  const renderedLabel = `${labelColor(fittedLabel)}${
    ' '.repeat(Math.max(0, labelWidth - fittedLabel.length))
  }`;
  const reserve = Cli.Fmt.Text.Width.measure(`${renderedLabel}${gap}`);
  const valueWidth = Cli.Fmt.Text.Width.fit({ width, reserve, terminal: false });
  const renderedValue = serviceValue(value, valueWidth);
  return `${renderedLabel}${gap}${renderedValue}`;
}

function fieldLabelColor(text: string) {
  return c.dim(c.gray(text));
}

function serviceValue(value: ServiceValue, width: number) {
  if (value.kind === 'path') {
    const display = Cli.Fmt.Path.tty(value.text, {
      fit: 'width',
      terminal: false,
      width,
      min: 1,
      highlightBasename: false,
    });
    return Cli.Fmt.hyperlink(c.underline(display), value.href);
  }
  if (value.kind === 'url') {
    const formatted = Cli.Fmt.Url.service(
      { href: value.text as t.StringUrl },
      { highlightOrigin: true },
    );
    return fitValue(formatted, width);
  }
  return fitValue(c.white(value.text), width);
}

function fitValue(value: string, width: number) {
  if (width <= 0) return '';
  if (Cli.Fmt.Text.Width.measure(value) <= width) return value;
  return Cli.Fmt.Text.ellipsize(Cli.stripAnsi(value), width);
}

function keyboardRows(width: number): readonly string[] {
  const text = `${c.gray('quit:')} ${c.white('ctrl + c')} ${c.gray('or')} ${c.white('q')}`;
  const textWidth = Cli.Fmt.Text.Width.measure(text);
  if (textWidth > width) return [];
  const indent = ' '.repeat(Math.max(0, width - textWidth));
  return ['', c.gray(Cli.Fmt.hr({ width, weight: 'dashed' })), `${indent}${text}`];
}

function fitRow(row: string, width: number) {
  if (Cli.Fmt.Text.Width.measure(row) <= width) return row;
  return Cli.Fmt.Text.ellipsize(Cli.stripAnsi(row), width);
}

function normalizeSize(size: ScreenSize): ScreenSize {
  const dimension = (value: number) => Num.Is.finite(value) ? Math.max(0, Math.floor(value)) : 0;
  return { width: dimension(size.width), height: dimension(size.height) };
}

function runCleanup(actions: readonly (() => void)[]): void {
  const failures: unknown[] = [];
  for (const action of actions) {
    try {
      action();
    } catch (cause) {
      failures.push(cause);
    }
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) throw new AggregateError(failures, 'start:gui screen cleanup failed.');
}
