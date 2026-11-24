import { ETBook, type t, useFontBundle, useStylesheetRule } from './common.ts';
import { code, headings } from './u.styles/mod.ts';

type P = { component: string; theme: t.Color.Theme };

/** Optional descendant rules; font loading and rule registration remain separate. */
export const useScopedStyles = (props: P): t.Style.Props => {
  useFontBundle(ETBook);
  const styles: t.Style.Props = {};

  // Each unconditional block can be removed without changing the other rule's ownership.
  {
    const { selector, rule, bindings } = code(props);
    useStylesheetRule(selector, rule);
    Object.assign(styles, bindings);
  }
  {
    const { selector, rule } = headings(props);
    useStylesheetRule(selector, rule);
  }

  return styles;
};
