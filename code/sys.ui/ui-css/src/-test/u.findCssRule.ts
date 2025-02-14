export function findCssRule(className: string): CSSRule | undefined {
  const selector = `.${className.replace(/^\./, '')}`.trim();
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        const selectorText = ((rule as any).selectorText || '').trim();
        if (selector === selectorText) return rule;
      }
    } catch (error) {
      // NB: Some styleSheets might not be accessible due to cross-origin restrictions.
      continue;
    }
  }
  return undefined;
}
