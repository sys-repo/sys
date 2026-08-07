import { metadataRow } from '../../m.fmt/u.ts';
import { c, Cli, Num, type t, Time } from '../common.ts';
import { ServeStatic } from './u.serve.static.ts';
import { ViteScreenLayout } from './u.vite.screen.layout.ts';

type FrameArgs = t.ViteServe.Screen.Frame.Args;
type Viewport = t.ViteServe.Screen.Frame.Viewport;
type StaticSnapshot = t.ViteServe.Static.Snapshot;
type ResizeSubscription = { unsubscribe(): void };

type FailureChannel = {
  readonly promise: Promise<never>;
  reject(cause: unknown): void;
};

const DISPOSED_REPORTER = Object.freeze(
  {
    failure: new Promise<never>(() => {}),
    dispose() {},
  } satisfies t.ViteServe.Screen.Reporter,
);

const DEFAULT_TERMINAL = Object.freeze(
  {
    cursorRows: 1,
    size: () => Cli.Screen.size(),
    events: (until) => Cli.Screen.events(until),
    repaint: (frame) => Cli.Screen.repaint(frame),
  } satisfies t.ViteServe.Screen.Runtime.Terminal,
);

/** Vite-owned responsive terminal screen for one static HTTP-server lifecycle. */
export const ServeScreen = {
  toString(args: FrameArgs) {
    const viewport = wrangle.viewport(args.viewport);
    const capacity = Math.max(0, viewport.height - wrangle.dimension(args.cursorRows));
    const sequenceWidth = 1;
    const metadataColumn = ViteScreenLayout.metadataColumn(viewport.width, sequenceWidth);
    const indent = ViteScreenLayout.indent(metadataColumn);
    const headerRows = ViteScreenLayout.applicationHeader(args.pkg, viewport.width);
    const header = headerRows.slice(0, capacity);
    if (header.length < headerRows.length) {
      return ViteScreenLayout.renderRows(header, viewport.width);
    }

    let available = capacity - header.length;
    const metadata = [
      ViteScreenLayout.serviceUrl(args.origin, metadataColumn, viewport.width),
      `${indent}${c.green('↑')}`,
      wrangle.staticRow(args.static, viewport.width, metadataColumn, args.renderedAt),
    ];
    const leadingGap = available >= metadata.length + 4 ? [''] : [];
    available -= leadingGap.length;
    if (available < metadata.length) {
      return ViteScreenLayout.renderRows(header, viewport.width);
    }

    available -= metadata.length;
    const divider = ViteScreenLayout.dashedDivider(viewport.width);
    const output = ViteScreenLayout.outputRow(
      wrangle.output(args.static),
      viewport.width,
      sequenceWidth,
    );
    const keyboard = wrangle.keyboardRows(viewport.width, metadataColumn);
    const tail = available >= keyboard.length + 4
      ? ['', divider, output, '', ...keyboard]
      : available >= 3
      ? ['', divider, output]
      : available === 2
      ? ['', divider]
      : available === 1
      ? [divider]
      : [];
    return ViteScreenLayout.renderRows(
      [...header, ...leadingGap, ...metadata, ...tail],
      viewport.width,
    );
  },

  create(args: t.ViteServe.Screen.Runtime.CreateArgs): t.ViteServe.Screen.Reporter {
    const terminal = args.deps?.terminal ?? DEFAULT_TERMINAL;
    const events = terminal.events(args.until);
    if (events.disposed) return DISPOSED_REPORTER;

    const failed = wrangle.failureChannel();
    let disposed = false;
    let acquired = false;
    let observed = false;
    let viewport: Viewport = { width: 0, height: 0 };
    let subscription: ResizeSubscription | undefined;

    const repaint = () => {
      terminal.repaint(ServeScreen.toString({
        pkg: args.pkg,
        origin: args.origin,
        static: args.static,
        viewport,
        cursorRows: terminal.cursorRows,
        renderedAt: Time.now.timestamp,
      }));
    };

    const release = () => {
      if (disposed) return;
      disposed = true;
      const current = subscription;
      subscription = undefined;
      wrangle.cleanup([() => current?.unsubscribe(), () => events.dispose()]);
    };

    const fail = (cause: unknown) => {
      if (disposed) return;
      try {
        release();
      } catch {
        // Preserve the presentation error that triggered rollback.
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
        if (!observed) viewport = initial;
      }
      repaint();
      acquired = true;
    } catch (error) {
      try {
        release();
      } catch {
        // Preserve the acquisition or initial-render error.
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
  viewport(input: Viewport): Viewport {
    return {
      width: wrangle.dimension(input.width),
      height: wrangle.dimension(input.height),
    };
  },

  dimension(input: number) {
    return Num.Is.finite(input) ? Math.max(0, Math.floor(input)) : 0;
  },

  staticRow(snapshot: StaticSnapshot, width: number, indent: number, renderedAt: t.UnixTimestamp) {
    const warning = ServeStatic.warning(snapshot);
    const suffixes = snapshot.kind === 'directory'
      ? ViteScreenLayout.distSuffixes(snapshot.dist, renderedAt)
      : warning
      ? [c.yellow(c.bold(warning))]
      : [];
    return metadataRow({
      label: 'static',
      value: ServeStatic.displayDir(snapshot.dir),
      width,
      indent,
      labelWidth: 9,
      styledLabel: c.white('static'),
      suffixes,
    });
  },

  keyboardRows(width: number, indent: number) {
    const key = (text: string) => c.bold(c.white(text));
    const row = (label: string, value: string) =>
      metadataRow({
        label,
        value,
        width,
        indent,
        labelWidth: 9,
        styledLabel: c.dim(c.gray(label)),
      });
    return [
      row('open', `${key('o')} ${c.dim('← (in browser)')}`),
      row('quit', key('ctrl + c or q')),
    ];
  },

  output(snapshot: StaticSnapshot): t.ViteScreen.Output.Line {
    return { sequence: 1, ...ServeStatic.output(snapshot) };
  },

  failureChannel(): FailureChannel {
    let reject: (cause: unknown) => void = () => {};
    const promise = new Promise<never>((_, rejectPromise) => {
      reject = rejectPromise;
    });
    return { promise, reject };
  },

  cleanup(actions: readonly (() => void)[]) {
    let failure: unknown;
    for (const action of actions) {
      try {
        action();
      } catch (error) {
        failure ??= error;
      }
    }
    if (failure) throw failure;
  },
} as const;
