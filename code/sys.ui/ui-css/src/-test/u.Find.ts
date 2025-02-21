/**
 * Helpers for querying the DOM of CSS rules.
 */
export const FindCss = {
  rule(className: string): CSSStyleRule | undefined {
    return FindCss.rules(className)[0];
  },

  rules(className: string): CSSStyleRule[] {
    const res: CSSStyleRule[] = [];
    const selector = `.${className.replace(/^\./, '')}`.trim();
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          const text = ((rule as any).selectorText || '').trim();
          if (text.startsWith(selector)) res.push(rule as CSSStyleRule);
        }
      } catch (error) {
        continue; // NB: Some styleSheets might not be accessible due to cross-origin restrictions.
      }
    }
    return res;
  },
} as const;
