import { Cli, Err, Fs, Is, pkg, Str, type t } from '../common.ts';
import { START_GUI_SERVICE } from '../../u/u.start.gui.service.ts';
import type { Start } from './t.ts';
import { normalizeScreenSize, renderScreen } from '../u.screen/u.render.ts';
import { captureRootLink } from '../u.screen/u.render.serviceRow.ts';

const DEFAULT_DEPENDENCIES: Start.Gui.Presentation.Dependencies = Object.freeze({
  isInteractive: () => Cli.Is.interactive(),
  size: () => Cli.Screen.size(),
  events: Cli.Screen.events,
  repaint: (frame) => Cli.Screen.repaint(frame),
  bindKeyboard: Cli.Keyboard.bind,
  shutdownKeyboard: Cli.Keyboard.shutdown,
});

const PREPARING: Extract<Start.Gui.Presentation.State, { kind: 'preparing' }> = Object.freeze({
  kind: 'preparing',
});
const STARTING: Extract<Start.Gui.Presentation.State, { kind: 'starting-app-host' }> = Object
  .freeze({
    kind: 'starting-app-host',
  });
const STOPPING: Extract<Start.Gui.Presentation.State, { kind: 'stopping' }> = Object.freeze({
  kind: 'stopping',
});
const BOOTSTRAP_PAGES = bootstrapPages();

/**
 * Browser and terminal presentation for one GUI session.
 */
export const StartGuiPresentation: Start.Gui.Presentation.Lib = Object.freeze({
  /**
   * Prepare immutable status projection, then acquire terminal owners.
   */
  prepare(
    input: Start.Gui.Presentation.Input,
    overrides: Partial<Start.Gui.Presentation.Dependencies> = {},
  ): Start.Gui.Presentation.Prepared {
    const deps = Object.freeze({ ...DEFAULT_DEPENDENCIES, ...overrides });
    const authority = input.authority;
    const root = authority?.kind === 'development' ? captureRootLink(authority.dir) : undefined;
    const manifestUrl = authority?.kind === 'release' ? authority.source.href : undefined;
    const recovery = input.recovery === START_GUI_SERVICE.recovery ? input.recovery : undefined;
    let state: Start.Gui.Presentation.State = PREPARING;

    const status = Object.freeze({
      pages: Object.freeze(
        BOOTSTRAP_PAGES.map((page) => Object.freeze({ key: page.key, bytes: page.bytes.slice() })),
      ),
      resolve: (): t.BootstrapStatus.Projection<Start.Gui.Presentation.BootstrapPageKey> =>
        state.kind === 'ready'
          ? Object.freeze({ kind: 'redirect', origin: state.origin })
          : Object.freeze({
            kind: 'page',
            key: state.kind === 'failed' ? `failed-${state.category}` : state.kind,
          }),
    });

    return Object.freeze({
      status,
      async acquire(url: t.StringUrl): Promise<Start.Gui.Presentation.Owner> {
        if (!deps.isInteractive() || !Cli.Fmt.isReady()) {
          throw Err.std('start:gui terminal presentation unavailable.');
        }

        let keyboard: t.Cli.Keyboard.Bind.Handle | undefined;
        let screenEvents: Start.Gui.Presentation.ResizeEvents | undefined;
        let resizeSubscription: { unsubscribe(): void } | undefined;
        let screenActive = false;
        let closing = false;
        let terminalLoss: Error | undefined;
        let closeOperation: Promise<void> | undefined;
        let openWarning = false;
        let viewport: t.Cli.Screen.Size = Object.freeze({ width: 0, height: 0 });
        let resizeObserved = false;
        const lost = Promise.withResolvers<never>();
        void lost.promise.catch(() => undefined);

        const paint = () => {
          if (!screenActive) return;
          deps.repaint(renderScreen({
            service: START_GUI_SERVICE.name,
            url,
            root,
            manifestUrl,
            recovery,
            state,
            keyboard: true,
            openWarning,
            viewport,
          }));
        };
        const releaseScreen = (): Error | undefined => {
          if (!screenActive && !resizeSubscription && !screenEvents) return;
          screenActive = false;
          let error: Error | undefined;
          const subscription = resizeSubscription;
          resizeSubscription = undefined;
          if (subscription) {
            try {
              subscription.unsubscribe();
            } catch (cause) {
              error = appendError(error, cause, 'start:gui resize subscription cleanup failed.');
            }
          }
          const events = screenEvents;
          screenEvents = undefined;
          if (events) {
            try {
              events.dispose();
            } catch (cause) {
              error = appendError(error, cause, 'start:gui screen event cleanup failed.');
            }
          }
          return error;
        };
        const lose = (cause: unknown): Error => {
          if (terminalLoss) return terminalLoss;
          let error: Error = new Error('start:gui screen presentation failed.', { cause });
          if (closing) return error;
          const releaseError = releaseScreen();
          if (releaseError) {
            error = new SuppressedError(
              error,
              releaseError,
              'start:gui screen presentation and release failed.',
            );
          }
          terminalLoss = error;
          lost.reject(error);
          return error;
        };
        const update = (next: Start.Gui.Presentation.State) => {
          if (terminalLoss) throw terminalLoss;
          state = next;
          try {
            paint();
          } catch (cause) {
            throw lose(cause);
          }
        };

        try {
          keyboard = deps.bindKeyboard({
            exit: false,
            onKey(event) {
              if (Cli.Keyboard.Is.redraw(event)) {
                try {
                  const measured = normalizeScreenSize(deps.size());
                  viewport = measured;
                  paint();
                } catch (cause) {
                  lose(cause);
                }
                return;
              }
              if (Cli.Keyboard.Is.back(event) && allowsBack(state)) input.onBack();
            },
            onQuit() {
              if (state.kind === 'failed') input.onDismiss();
              else input.onQuit();
            },
          });
          if (!keyboard) throw Err.std('start:gui keyboard presentation unavailable.');

          screenEvents = deps.events();
          resizeSubscription = screenEvents.resize$.subscribe((event: t.Cli.Screen.SizeChanged) => {
            if (closing || !screenActive) return;
            try {
              viewport = normalizeScreenSize(resizeAfter(event));
              resizeObserved = true;
              paint();
            } catch (cause) {
              lose(cause);
            }
          });
          if (!resizeObserved) viewport = normalizeScreenSize(deps.size());
          screenActive = true;
          paint();
        } catch (cause) {
          closing = true;
          let error: Error = Err.std(cause);
          const releaseError = releaseScreen();
          if (releaseError) {
            error = new SuppressedError(
              error,
              releaseError,
              'start:gui presentation acquisition and screen cleanup failed.',
            );
          }
          if (keyboard) {
            try {
              await deps.shutdownKeyboard(keyboard);
            } catch (cleanupCause) {
              error = new SuppressedError(
                error,
                Err.std(cleanupCause),
                'start:gui presentation acquisition and keyboard cleanup failed.',
              );
            }
          }
          throw error;
        }

        const keyboardOwner = keyboard;
        void keyboardOwner.finished.then(
          () => lose(new Error('start:gui keyboard listener stopped.')),
          (cause) => lose(new Error('start:gui keyboard listener failed.', { cause })),
        );

        const owner: Start.Gui.Presentation.Owner = Object.freeze({
          lost: lost.promise,
          get current() {
            return state;
          },
          starting() {
            update(STARTING);
          },
          ready(ready) {
            let directoryHref: t.StringUrl | undefined;
            try {
              directoryHref = Fs.Path.toFileUrl(ready.dir).href;
            } catch {
              // A missing directory hyperlink does not change admitted host truth.
            }
            update(Object.freeze({
              kind: 'ready',
              origin: ready.origin,
              digest: ready.digest,
              ...(directoryHref ? { directoryHref } : {}),
            }));
          },
          failed(failure) {
            update(Object.freeze({
              kind: 'failed',
              category: failure.category,
              safeEvidence: failure.evidence,
            }));
          },
          warnOpen() {
            if (openWarning) return;
            openWarning = true;
            update(state);
          },
          redraw() {
            try {
              viewport = normalizeScreenSize(deps.size());
              paint();
            } catch (cause) {
              lose(cause);
            }
          },
          shutdown() {
            if (closeOperation) return closeOperation;
            closing = true;
            let screenError: Error | undefined;
            try {
              state = STOPPING;
              paint();
            } catch (cause) {
              screenError = Err.std('start:gui stopping presentation failed.', { cause });
            }
            const releaseError = releaseScreen();
            if (releaseError) {
              screenError = screenError
                ? new SuppressedError(
                  screenError,
                  releaseError,
                  'start:gui stopping presentation and screen release failed.',
                )
                : releaseError;
            }

            let keyboardOperation: Promise<void>;
            try {
              keyboardOperation = deps.shutdownKeyboard(keyboardOwner);
            } catch (cause) {
              keyboardOperation = Promise.reject(cause);
            }
            closeOperation = keyboardOperation.then(
              () => {
                if (screenError) throw screenError;
              },
              (cause) => {
                if (!screenError) throw cause;
                throw new SuppressedError(
                  screenError,
                  cause,
                  'start:gui presentation shutdown failed.',
                );
              },
            );
            void closeOperation.catch(() => undefined);
            return closeOperation;
          },
        });
        return owner;
      },
    });
  },

  /**
   * Render one finite presentation snapshot without acquiring owners.
   */
  toString(input: Start.Gui.Presentation.RenderInput): string {
    return renderScreen(input);
  },
});

/**
 * Helpers:
 */
function bootstrapPages(): readonly t.BootstrapStatus.Page<
  Start.Gui.Presentation.BootstrapPageKey
>[] {
  const applicationName = `${pkg.name}/ui`;
  const couldNotStart = `${applicationName} could not start`;
  return Object.freeze([
    bootstrapPage('preparing', {
      title: `Preparing ${applicationName}`,
      message: `${applicationName} is preparing the application.`,
      refresh: 'reload',
    }),
    bootstrapPage('starting-app-host', {
      title: `Starting ${applicationName}`,
      message: 'The application host is starting.',
      refresh: 'reload',
    }),
    bootstrapPage('failed-configuration-invalid', {
      title: `${applicationName} configuration invalid`,
      heading: couldNotStart,
      message:
        'The launcher configuration is invalid. Return to the terminal for safe details, then restart.',
    }),
    bootstrapPage('failed-source-unavailable', {
      title: `${applicationName} source unavailable`,
      heading: couldNotStart,
      message:
        'The application source is unavailable. Return to the terminal for safe details, then restart.',
    }),
    bootstrapPage('failed-artifact-refused', {
      title: `${applicationName} artifact refused`,
      heading: couldNotStart,
      message:
        'The application artifact was refused. Return to the terminal for safe details, then restart.',
    }),
    bootstrapPage('failed-repair-required', {
      title: `${applicationName} repair required`,
      heading: couldNotStart,
      message:
        'The local application cache requires trusted repair. Return to the terminal for guidance.',
    }),
    bootstrapPage('failed-local-failure', {
      title: `${applicationName} local failure`,
      heading: couldNotStart,
      message:
        'A local startup operation failed. Return to the terminal for safe details, then restart.',
    }),
    bootstrapPage('failed-cancelled', {
      title: `${applicationName} launch cancelled`,
      message: 'The trusted launcher cancelled startup.',
    }),
    bootstrapPage('stopping', {
      title: `Stopping ${applicationName}`,
      message: 'The local application session is closing.',
    }),
  ]);
}

function bootstrapPage(
  key: Start.Gui.Presentation.BootstrapPageKey,
  copy: Start.Gui.Presentation.Page.Copy,
): t.BootstrapStatus.Page<Start.Gui.Presentation.BootstrapPageKey> {
  const bodyStyle =
    'font-family:sans-serif;font-size:16px;line-height:1.3;margin:0;padding:24px 30px';
  const titleStyle = 'font-size:inherit;line-height:inherit;font-weight:700;margin:0';
  const messageStyle = 'font-size:inherit;line-height:inherit;font-weight:400;margin:4px 0 0';
  const refresh = copy.refresh === 'reload' ? '<meta http-equiv="refresh" content="1">' : '';
  const html = Str.dedent(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        ${refresh}
        <title>${copy.title}</title>
      </head>
      <body style="${bodyStyle}">
        <main>
          <h1 style="${titleStyle}">${copy.heading ?? copy.title}</h1>
          <p style="${messageStyle}">${copy.message}</p>
        </main>
      </body>
    </html>
  `);
  return Object.freeze({ key, bytes: new TextEncoder().encode(html) });
}

function allowsBack(state: Start.Gui.Presentation.State): boolean {
  return state.kind === 'preparing' || state.kind === 'starting-app-host' || state.kind === 'ready';
}

function resizeAfter(input: unknown): unknown {
  if (!Is.plainObject(input)) return;
  return input.kind === 'size:changed' ? input.after : undefined;
}

function appendError(current: Error | undefined, cause: unknown, message: string): Error {
  const next = Is.error(cause) ? cause : new Error(message, { cause });
  return current ? new SuppressedError(current, next, message) : next;
}
