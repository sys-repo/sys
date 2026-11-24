import { Color, Obj, type t } from './common.ts';

/** Pure code declarations and root bindings; registration belongs to the React hook. */
export function code({ component, theme }: { component: string; theme: t.Color.Theme }) {
  const selector = 'code';
  const key = Obj.hash([component, selector]);
  const names = {
    fg: `--scoped-${key}-fg`,
    bg: `--scoped-${key}-bg`,
    border: `--scoped-${key}-border`,
  } as const;

  return {
    selector: `[data-component="${component}"] ${selector}`,
    rule: {
      backgroundColor: `var(${names.bg})`,
      color: `var(${names.fg})`,
      fontFamily: 'monospace',
      fontWeight: 600,
      fontSize: '0.85em',
      lineHeight: 1,
      Padding: [2, 4],
      borderRadius: 4,
      border: `solid 1px var(${names.border})`,
    } satisfies t.CssValue,
    bindings: {
      [names.fg]: Color.alpha(theme.fg, 0.8),
      [names.bg]: Color.alpha(theme.fg, 0.03),
      [names.border]: Color.alpha(theme.fg, 0.15),
    } satisfies t.Style.Props,
  };
}
