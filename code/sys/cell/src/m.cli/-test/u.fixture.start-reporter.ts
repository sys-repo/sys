import { FakeSpinner } from '@sys/cli/testing';
import type { t } from '../common.ts';
import { StartReporter } from '../u.lifecycle/u.start.reporter.ts';
import { formatStartServiceBody } from '../u.lifecycle/u.start.ts';

type ReporterMode = 'raw' | 'screen';
type ScreenSize = t.Cli.Screen.Size;
type KeyboardOptions = t.Cli.Keyboard.Bind.Options;
type KeyEvent = Parameters<NonNullable<KeyboardOptions['onKey']>>[0];
type HarnessOptions = {
  acceptFailure?: boolean;
  cancelError?: Error;
  controls?: boolean;
  header?: string;
  keyboard?: 'acquired' | 'unavailable';
  measure?: () => ScreenSize;
  onRepaint?: (frame: string) => void;
  printError?: Error;
  repaintError?: Error;
  releaseError?: Error;
  resizeOnObserve?: ScreenSize;
  shutdownError?: Error;
  size?: ScreenSize;
  stopError?: Error;
  terminal?: boolean;
};

/**
 * A framed body that exposes the width passed to its renderer.
 */
export function readyBody() {
  const render = (width: number | undefined) => `body:${width}`;
  return {
    text: formatStartServiceBody(render, 80, false),
    render: (options?: { width?: number; hyperlinks?: boolean }) => {
      return formatStartServiceBody(render, options?.width ?? 80, false);
    },
  } as const;
}

/**
 * Record reporter effects without acquiring a terminal, timer, or real keyboard listener.
 */
export function createHarness(mode: ReporterMode, options: HarnessOptions = {}) {
  const effects: string[] = [];
  const failures: unknown[] = [];
  const frames: string[] = [];
  const spinner = FakeSpinner.create();
  const start = spinner.start;
  const stop = spinner.stop;
  let currentSize = options.size ?? { width: 80, height: 24 };
  let printError = options.printError;
  let repaintError = options.repaintError;
  let keyboardOptions: KeyboardOptions | undefined;
  let onResize: (size: ScreenSize) => void = () => {};
  let resolveKeyboard: () => void = () => undefined;
  let rejectKeyboard: (cause: unknown) => void = () => undefined;
  let keyboardDisposed = false;
  const keyboardFinished = new Promise<void>((resolve, reject) => {
    resolveKeyboard = resolve;
    rejectKeyboard = reject;
  });
  const keyboard = {
    finished: keyboardFinished,
    dispose() {
      if (keyboardDisposed) return;
      keyboardDisposed = true;
      effects.push('keyboard:dispose');
      resolveKeyboard();
    },
  };

  spinner.start = (text) => {
    effects.push(`spinner:start:${text ?? spinner.text}`);
    return start(text);
  };
  spinner.stop = () => {
    effects.push('spinner:stop');
    if (options.stopError) throw options.stopError;
    return stop();
  };

  const reporter = StartReporter.create(
    mode,
    {
      isInteractive: () => true,
      isTerminal: () => options.terminal ?? true,
      print(text) {
        effects.push(`print:${text}`);
        if (printError) throw printError;
      },
      header: (width) => options.header ?? `header:${width ?? 'raw'}`,
      startText: (count) => `starting:${count}`,
      size: () => options.measure?.() ?? currentSize,
      observeResize(handler) {
        effects.push('screen:observe');
        onResize = handler;
        if (options.resizeOnObserve) handler(options.resizeOnObserve);
        return () => {
          effects.push('screen:release');
          if (options.releaseError) throw options.releaseError;
        };
      },
      repaint(frame) {
        effects.push(`repaint:${frame}`);
        frames.push(frame);
        options.onRepaint?.(frame);
        if (repaintError) throw repaintError;
      },
      spinner: (target) => {
        effects.push(`spinner:create:${target ?? 'raw'}`);
        return spinner;
      },
      interval: () => {
        effects.push('interval:start');
        return () => {
          effects.push('interval:cancel');
          if (options.cancelError) throw options.cancelError;
        };
      },
      bindKeyboard(input) {
        effects.push('keyboard:bind');
        keyboardOptions = input;
        return options.keyboard === 'unavailable' ? undefined : keyboard;
      },
      async shutdownKeyboard(owner) {
        effects.push('keyboard:shutdown');
        owner.dispose();
        await owner.finished;
        if (options.shutdownError) throw options.shutdownError;
      },
    },
    options.controls
      ? {
        until: new Promise<never>(() => undefined),
        onInterrupt: () => effects.push('keyboard:interrupt'),
        onFailure(cause) {
          failures.push(cause);
          effects.push('keyboard:failure');
          return options.acceptFailure ?? true;
        },
      }
      : undefined,
  );

  return {
    reporter,
    effects,
    failures,
    frames,
    binding: () => keyboardOptions,
    async key(event: Partial<KeyEvent>) {
      await keyboardOptions?.onKey?.(event as KeyEvent);
    },
    async interrupt() {
      await keyboardOptions?.onQuit();
      keyboardDisposed = true;
      resolveKeyboard();
      await Promise.resolve();
    },
    finishKeyboard() {
      keyboardDisposed = true;
      resolveKeyboard();
    },
    failKeyboard(cause: unknown) {
      keyboardDisposed = true;
      rejectKeyboard(cause);
    },
    resize(size: ScreenSize) {
      currentSize = size;
      onResize(size);
    },
    setPrintError(cause?: Error) {
      printError = cause;
    },
    setRepaintError(cause?: Error) {
      repaintError = cause;
    },
    setSize(size: ScreenSize) {
      currentSize = size;
    },
  } as const;
}

/**
 * Key and modifier fields used by the reporter, with optional test overrides.
 */
export function keyEvent(key: string, overrides: Partial<KeyEvent> = {}): Partial<KeyEvent> {
  return {
    key,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    shiftKey: false,
    ...overrides,
  };
}

/**
 * The unmodified lowercase redraw key, with optional test overrides.
 */
export function redrawKey(overrides: Partial<KeyEvent> = {}): Partial<KeyEvent> {
  return keyEvent('r', overrides);
}
