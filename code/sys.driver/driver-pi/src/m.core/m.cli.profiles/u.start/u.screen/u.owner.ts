import { Cli } from '../common.ts';

import { START_GUI_SERVICE } from '../../u/u.start.gui.service.ts';
import { createOwnedError, ownedError } from '../u.error.ts';
import { captureManifestUrl, captureRootLink, normalizeSize } from './u.input.ts';
import { renderScreen } from './u.render.ts';
import { observeResizeWith, throwCleanupFailures } from './u.resize.ts';
import type {
  ScreenSize,
  StartGuiScreenDependencies,
  StartGuiScreenInput,
  StartGuiScreenInstance,
  StartGuiScreenRenderInput,
} from './t.ts';

const freeze = Object.freeze;
const DEFAULT_DEPS: StartGuiScreenDependencies = freeze({
  isInteractive: () => Cli.Is.interactive(),
  size: () => Cli.Screen.size(),
  observeResize: (handler) => observeResizeWith(Cli.Screen.events, handler),
  repaint: (frame) => Cli.Screen.repaint(frame),
});

/**
 * Responsive terminal owner for the direct Pi GUI host.
 */
export const StartGuiScreen = {
  /**
   * Acquire the responsive screen lifecycle.
   */
  create(
    input: StartGuiScreenInput,
    overrides: Partial<StartGuiScreenDependencies> = {},
  ): StartGuiScreenInstance {
    const root = captureRootLink(input.root);
    const manifestUrl = captureManifestUrl(input.manifestUrl);
    const recovery = input.recovery === START_GUI_SERVICE.recovery ? input.recovery : undefined;
    const deps = { ...DEFAULT_DEPS, ...overrides };
    if (!deps.isInteractive()) {
      return freeze({
        kind: 'unavailable',
        failure: new Promise<never>(() => undefined),
        redraw() {},
        warnOpen() {},
        dispose() {},
      });
    }

    const failure = Promise.withResolvers<never>();
    void failure.promise.catch(() => undefined);
    let active = true;
    let acquired = false;
    let observed = false;
    let redrawing = false;
    let resizeRevision = 0;
    let failureSettled = false;
    let openWarning = false;
    let viewport: ScreenSize = { width: 0, height: 0 };
    let releaseResize: (() => void) | undefined;
    let releaseState: (() => void) | undefined;

    const release = () => {
      active = false;
      const failures: unknown[] = [];
      if (releaseState) {
        try {
          releaseState();
          releaseState = undefined;
        } catch (cause) {
          failures.push(cause);
        }
      }
      if (releaseResize) {
        try {
          releaseResize();
          releaseResize = undefined;
        } catch (cause) {
          failures.push(cause);
        }
      }
      throwCleanupFailures(failures);
    };
    const repaint = () =>
      deps.repaint(StartGuiScreen.toString({
        service: input.service,
        url: input.url,
        root,
        manifestUrl,
        recovery,
        state: input.state.current,
        keyboard: input.keyboard,
        openWarning,
        viewport,
      }));
    const fail = (cause: unknown) => {
      if (failureSettled) return;
      failureSettled = true;
      try {
        input.onFailure(ownedError(cause, 'start:gui screen failed.'));
      } catch {
        // The failure promise remains the independently owned fallback observation channel.
      }
      try {
        release();
      } catch {
        // Retryable cleanup authority remains on the returned screen handle.
      }
      failure.reject(createOwnedError('start:gui screen failed.'));
    };

    try {
      releaseState = input.state.subscribe(() => {
        if (!active || !acquired || redrawing) return;
        try {
          repaint();
        } catch (cause) {
          fail(cause);
        }
      });
      releaseResize = deps.observeResize((size) => {
        if (!active) return;
        try {
          viewport = normalizeSize(size);
          observed = true;
          resizeRevision += 1;
          if (!acquired || redrawing) return;
          repaint();
        } catch (cause) {
          fail(cause);
        }
      });
      if (!active) throw createOwnedError('start:gui screen failed.');
      if (!observed) {
        const measured = deps.size();
        if (!active) throw createOwnedError('start:gui screen failed.');
        const initial = normalizeSize(measured);
        if (!active) throw createOwnedError('start:gui screen failed.');
        if (!observed) {
          viewport = initial;
          observed = true;
        }
      }
      if (!active) throw createOwnedError('start:gui screen failed.');
      repaint();
      if (!active) throw createOwnedError('start:gui screen failed.');
      acquired = true;
    } catch (cause) {
      fail(cause);
    }

    return freeze({
      kind: acquired ? 'acquired' : 'failed',
      failure: failure.promise,
      redraw() {
        if (!active || !acquired || redrawing) return;
        const revision = resizeRevision;
        redrawing = true;
        try {
          const measured = normalizeSize(deps.size());
          if (!active || !acquired) return;
          if (resizeRevision === revision) viewport = measured;
          repaint();
        } catch (cause) {
          fail(cause);
        } finally {
          redrawing = false;
        }
      },
      warnOpen() {
        if (!active || openWarning) return;
        openWarning = true;
        if (!acquired) return;
        try {
          repaint();
        } catch (cause) {
          fail(cause);
        }
      },
      dispose: release,
    });
  },

  /**
   * Project one screen state into its bounded terminal frame.
   */
  toString: (input: StartGuiScreenRenderInput): string => renderScreen(input),
} as const;
