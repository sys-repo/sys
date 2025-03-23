/**
 * Helpers for querying the DOM of CSS rules.
 */
export const FindCss = {
  rule(className: string): CSSStyleRule | CSSGroupingRule | undefined {
    return FindCss.rules(className)[0];
  },

  rules(className: string): (CSSStyleRule | CSSGroupingRule)[] {
    const res: (CSSStyleRule | CSSGroupingRule)[] = [];
    const selector = `.${className.replace(/^\./, '')}`.trim();

    // 🌳 Recursive function to search through CSSRuleList.
    //      If a grouping rule (e.g. @container) contains a matching rule,
    //      then return the grouping rule so that the context details are visible.
    const searchRules = (ruleList: CSSRuleList): (CSSStyleRule | CSSGroupingRule)[] => {
      const found: (CSSStyleRule | CSSGroupingRule)[] = [];
      for (const rule of Array.from(ruleList)) {
        // Check if this is a grouping rule with nested rules.
        if (
          'cssRules' in rule &&
          rule.cssRules &&
          typeof rule.cssText === 'string' &&
          rule.cssText.trim().startsWith('@')
        ) {
          // Recursively search its nested rules.
          const nestedFound = searchRules(rule.cssRules as any);
          if (nestedFound.length > 0) {
            // If any nested rule matches, return the grouping rule itself.
            found.push(rule as CSSGroupingRule);
            continue;
          }
        }
        // Otherwise, if this is a CSSStyleRule, check its selector.
        if ('selectorText' in rule && rule.selectorText) {
          const text = (rule as any).selectorText.trim();
          if (text.startsWith(selector)) {
            found.push(rule as CSSStyleRule);
          }
        }
      }
      return found;
    };

    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const found = searchRules(sheet.cssRules);
        res.push(...found);
      } catch (error) {
        // NB: Some styleSheets might not be accessible due to cross-origin restrictions.
        continue;
      }
    }
    return res;
  },
} as const;
