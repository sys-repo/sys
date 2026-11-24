/**
 * @module
 * Apply a theme to the DevHarness host, once or as a theme signal changes.
 */
import { Color, DEFAULTS, Signal } from './common.ts';
import type { DevThemeLib } from './t.ts';

/**
 * Helpers for working with common themes within the harness.
 */
export const Theme: DevThemeLib = {
  /**
   * Adjust the theme of the DevHarness.
   */
  background(ctx, input, subjectLight, subjectDark) {
    const { host, subject } = ctx;
    const theme = Color.theme(input);
    const { is } = theme;
    if (is.light) host.color(null).backgroundColor(null).tracelineColor(null);
    if (is.dark) host.color(Color.WHITE).backgroundColor(Color.DARK).tracelineColor(0.08);
    host.dividerColor(
      Color.alpha(is.dark ? Color.WHITE : Color.BLACK, DEFAULTS.host.dividerOpacity),
    );

    if (!!subjectLight || !!subjectDark) {
      if (!!subjectLight) subject.backgroundColor(is.light ? subjectLight : 0);
      if (!!subjectDark) subject.backgroundColor(is.dark ? subjectDark : 0);
    }

    return theme;
  },

  /**
   * Hook into a theme Signal and keep the DevHarness sycned with it.
   */
  signalEffect(ctx, theme, subjectLight, subjectDark) {
    const unsubscribe = Signal.effect(() => {
      Theme.background(ctx, theme.value, subjectLight, subjectDark);
      ctx.redraw();
    });
    ctx.dispose$.subscribe(() => unsubscribe());
  },
};
