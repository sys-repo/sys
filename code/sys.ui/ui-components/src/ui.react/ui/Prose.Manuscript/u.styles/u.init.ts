import { type t, Color, D, Rx, Style } from './common.ts';
import { code } from './u.rule.code.ts';
import { headings } from './u.rule.headings.ts';

type P = { theme?: t.CommonTheme };

/**
 * Initialize global styles.
 */
export function initStyles(props: P, opts: { life?: t.Lifecycle } = {}) {
  const life = Rx.lifecycle(opts.life);
  const theme = Color.theme(props.theme);
  const sheet = Style.Dom.stylesheet();
  const scope = `[data-component="${D.componentAttr}"]`;
  const rule: t.Prose.ScopedCssRule = (selector, css) => sheet.rule(`${scope} ${selector}`, css);

  code({ rule, theme });
  headings({ rule, theme });

  return {
    sheet,
    dispose: () => life.dispose(),
  };
}
