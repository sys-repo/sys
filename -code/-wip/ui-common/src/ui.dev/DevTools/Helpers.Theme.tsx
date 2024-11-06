import { COLORS, Color, DevIcons, ObjectPath, type t } from '../common';
import { Wrangle } from './u.Wrangle';

type O = Record<string, unknown>;
type Color = string | number;
type ThemeInput = t.ColorTheme | t.CommonTheme | null;
const defaultTheme: t.CommonTheme = 'Light';

/**
 * Helpers for working with common themes within the harness.
 */
export const Theme = {
  /**
   * Adjust the theme of the DevHarness.
   */
  background(
    input: t.DevCtx | t.DevTools,
    theme?: ThemeInput,
    subjectLight?: Color | null,
    subjectDark?: Color | null,
  ) {
    const ctx = Wrangle.ctx(input);
    if (!ctx) throw new Error(`Dev {ctx} not retrieved`);

    const { host, subject } = ctx;
    const is = Color.theme(theme ?? defaultTheme).is;
    if (is.light) host.color(null).backgroundColor(null).tracelineColor(null);
    if (is.dark) host.color(COLORS.WHITE).backgroundColor(COLORS.DARK).tracelineColor(0.08);

    if (!!subjectLight || !!subjectDark) {
      if (!!subjectLight) subject.backgroundColor(is.light ? subjectLight : 0);
      if (!!subjectDark) subject.backgroundColor(is.dark ? subjectDark : 0);
    }

    return Color.theme(theme);
  },

  /**
   * A theme selector switch using a typed {Object} path.
   */
  switch<T extends O>(
    dev: t.DevTools<T>,
    path: t.TypedObjectPath<T>,
    onChange?: (value: t.CommonTheme) => void,
  ) {
    return Theme.switcher(
      dev,
      (d) => ObjectPath.resolve(d, path) as t.CommonTheme | undefined,
      (d, value) => {
        ObjectPath.Mutate.value(d, path, value);
        onChange?.(value);
      },
    );
  },

  switcher<T extends O>(
    dev: t.DevTools<T>,
    current: (d: T) => t.CommonTheme | undefined,
    mutate: (d: T, value: t.CommonTheme) => void,
  ) {
    return dev.button((btn) => {
      btn
        .label((e) => `theme: "${current(e.state) ?? defaultTheme}"`)
        .right((e) => {
          const name = current(e.state) ?? defaultTheme;
          const theme = Color.theme(name);
          const Icon = theme.is.dark ? DevIcons.Theme.Dark : DevIcons.Theme.Light;
          return <Icon size={16} />;
        })
        .onClick((e) => {
          const prev = current(e.state.current) ?? defaultTheme;
          const next = prev === 'Light' ? 'Dark' : 'Light';
          dev.change((d) => mutate(d, next));
          Theme.background(dev.ctx, next);
        });
    });
  },

  immutable<T extends { theme?: t.CommonTheme }>(
    dev: t.DevTools,
    state: t.Immutable<T>,
    subjectLight?: Color | null,
    subjectDark?: Color | null,
  ) {
    const current = () => state.current.theme;
    return dev.button((btn) => {
      btn
        .label((e) => `theme: "${current() ?? defaultTheme}"`)
        .right((e) => {
          const name = current() ?? defaultTheme;
          const theme = Color.theme(name);
          const Icon = theme.is.dark ? DevIcons.Theme.Dark : DevIcons.Theme.Light;
          return <Icon size={16} />;
        })
        .onClick((e) => {
          const prev = current() ?? defaultTheme;
          const next = prev === 'Light' ? 'Dark' : 'Light';
          state.change((d) => (d.theme = next));
          Theme.background(dev.ctx, next, subjectLight, subjectDark);
          dev.redraw();
        });
    });
  },
} as const;
