import type { t } from '../common.ts';

export const SERVICE = 'sys.ui:pi';
export const CAPABILITY = (() => {
  const ORIGIN = 'http://127.0.0.1:51260';
  const DISPLAY_ORIGIN = 'http://localhost:51260';
  const SUFFIX = '/0123456789abcdefghijklmno';
  return Object.freeze({
    ORIGIN,
    DISPLAY_ORIGIN,
    SUFFIX,
    URL: `${ORIGIN}${SUFFIX}` as t.StringUrl,
    DISPLAY: `${DISPLAY_ORIGIN}${SUFFIX}`,
  });
})();
export const APPLICATION = Object.freeze({
  URL: 'http://127.0.0.1:51261' as t.StringUrl,
  DISPLAY: 'http://localhost:51261',
});
export const DEVELOPMENT_ROOT =
  '/private/var/folders/ab/cdef/T/@sys-driver-pi.start-gui-preview.0123456789abcdef' as t.StringAbsoluteDir;

type ScreenSize = t.Cli.Screen.Size;

type ScreenHarnessOptions = {
  readonly resizeOnSize?: ScreenSize;
  readonly releaseError?: unknown;
  readonly repaint?: (frame: string, count: number) => void;
};

/** Stateful terminal-effects fixture for the direct GUI screen owner. */
export function createScreenHarness(
  initial: ScreenSize,
  interactive = true,
  options: ScreenHarnessOptions = {},
) {
  const frames: string[] = [];
  let releases = 0;
  let measured = false;
  let onResize: (size: unknown) => void = () => {};

  return {
    frames,
    get releases() {
      return releases;
    },
    deps: {
      isInteractive: () => interactive,
      size() {
        if (!measured && options.resizeOnSize) {
          measured = true;
          onResize(options.resizeOnSize);
        }
        return initial;
      },
      observeResize(handler: (size: unknown) => void) {
        onResize = handler;
        return () => {
          releases += 1;
          if (options.releaseError !== undefined) throw options.releaseError;
        };
      },
      repaint(frame: string) {
        frames.push(frame);
        options.repaint?.(frame, frames.length);
      },
    },
    resize(size: ScreenSize) {
      onResize(size);
    },
  } as const;
}
