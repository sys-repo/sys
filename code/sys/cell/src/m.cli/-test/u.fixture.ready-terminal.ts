import { bindKeyboardInput, EventEmitter, FakeSpinner, stripAnsi, type t } from './common.ts';
import type { StartReporterDeps } from '../u.lifecycle/u.start.reporter.ts';

/** Keep the real input decoder, keyboard binding, and shutdown join; replace only terminal I/O. */
export function readyTerminal(options: { failRelease: boolean }) {
  const input = new EventEmitter();
  const opens: string[] = [];
  let raw = false;
  let failRelease = options.failRelease;
  let frame = '';
  let resize = (_size: t.Cli.Screen.Size) => {};
  let binding: t.Cli.Keyboard.Bind.Handle | undefined;
  const size = () => ({ width: 100, height: 30 });
  const deps: Partial<StartReporterDeps> = {
    isInteractive: () => true,
    isTerminal: () => true,
    size,
    spinner: () => FakeSpinner.create(),
    observeResize(handler) {
      resize = handler;
      return () => {};
    },
    repaint(text) {
      frame = stripAnsi(text);
    },
    openBrowser(href) {
      opens.push(href);
    },
    bindKeyboard(controls) {
      binding = bindKeyboardInput(controls, {
        afterPause: queueMicrotask,
        stdin: () => ({
          get isRaw() {
            return raw;
          },
          setRawMode(value) {
            raw = value;
          },
          pause() {},
          resume() {},
          on: (event, fn) => input.on(event, fn),
          removeListener(event, fn) {
            if (event === 'error' && failRelease) {
              failRelease = false;
              throw new Error('injected deferred release failure');
            }
            input.removeListener(event, fn);
          },
        }),
      });
      return binding;
    },
  };
  return {
    deps,
    opens,
    frame: () => frame,
    resize: () => resize(size()),
    key: (key: string) => input.emit('data', new TextEncoder().encode(key)),
    finished: () => binding?.finished,
    released: () => !raw && input.eventNames().length === 0,
  };
}
