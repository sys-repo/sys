import { ETBook, type t } from './common.ts';

/** Theme-independent heading declarations, separate from inline code styling. */
export function headings({ component }: { component: string }) {
  return {
    selector: `[data-component="${component}"] h1`,
    rule: {
      fontFamily: `"${ETBook.config.family}", Georgia, serif`,
      fontWeight: 400,
      fontSize: '3em',
      lineHeight: 1.1,
    } satisfies t.CssValue,
  };
}
