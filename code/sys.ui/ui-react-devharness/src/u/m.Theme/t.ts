import type { t } from './common.ts';

type Color = string | number;
type ThemeInput = t.ColorTheme | t.CommonTheme | null;

/**
 * Helpers for working with common themes within the harness.
 */
export type DevThemeLib = {
  /** Adjust the theme of the DevHarness. */
  background(
    ctx: t.DevCtx,
    theme?: ThemeInput,
    subjectLight?: Color | null,
    subjectDark?: Color | null,
  ): void;

  /** Hook into a theme Signal and keep the DevHarness sycned with it. */
  signalEffect(
    ctx: t.DevCtx,
    signal: t.Signal,
    subjectLight?: Color | null,
    subjectDark?: Color | null,
  ): void;
};
