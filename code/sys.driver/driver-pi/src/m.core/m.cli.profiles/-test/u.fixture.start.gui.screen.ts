import { type t } from '../common.ts';

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
  let onResize: (size: ScreenSize) => void = () => {};

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
      observeResize(handler: (size: ScreenSize) => void) {
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
