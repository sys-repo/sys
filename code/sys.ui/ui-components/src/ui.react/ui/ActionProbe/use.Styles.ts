import { Color, Obj, type t, useStylesheetRule } from './common.ts';

type P = { component: string; theme: t.Color.Theme };

/** Optional descendant rules; theme values belong to each component root. */
export const useScopedStyles = ({ component, theme }: P): t.Style.Props => {
  const styles: t.Style.Props = {};

  // Keep each rule and its root bindings independently removable.
  {
    const selector = 'code';
    const key = Obj.hash([component, selector]);
    const names = {
      fg: `--scoped-${key}-fg`,
      bg: `--scoped-${key}-bg`,
      border: `--scoped-${key}-border`,
    } as const;

    useStylesheetRule(`[data-component="${component}"] ${selector}`, {
      backgroundColor: `var(${names.bg})`,
      color: `var(${names.fg})`,
      fontFamily: 'monospace',
      fontWeight: 600,
      fontSize: '0.85em',
      lineHeight: 1.9,
      Padding: [2, 4],
      borderRadius: 4,
      border: `solid 1px var(${names.border})`,
    });

    Object.assign(
      styles,
      {
        [names.fg]: Color.alpha(theme.fg, 0.8),
        [names.bg]: Color.alpha(theme.fg, 0.03),
        [names.border]: Color.alpha(theme.fg, 0.15),
      } satisfies t.Style.Props,
    );
  }

  return styles;
};
