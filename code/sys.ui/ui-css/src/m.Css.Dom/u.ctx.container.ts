import { type t } from './common.ts';

type StringSelector = string;

/**
 * CSS: @container API
 */
export function createContainer(args: {
  rules: t.CssDomRules;
  condition: string;
  name?: string;
  scope?: StringSelector[];
}): t.CssDomContainerBlock {
  const { rules, name, scope = [] } = args;
  const condition = wrangle.condition(args.condition);
  const inserted = new Set<t.CssDomInsertedRule>();

  const api: t.CssDomContainerBlock = {
    kind: '@container',
    condition,
    name,
    toString(kind = 'QueryCondition') {
      return toString(api, kind);
    },
    rules: {
      get inserted() {
        return Array.from(inserted);
      },
      add(selector, style) {
        selector = wrangle.selector(selector, scope);
        const context = api.toString();
        const styles = Array.isArray(style) ? style : [style];
        const res = rules.add(selector, styles, { context });
        if (res.length > 0) res.forEach((m) => inserted.add(m));
        return res;
      },
    },

    scope(selector) {
      return createContainer({ rules, name, condition, scope: [...scope, selector] });
    },
  };

  return api;
}

/**
 * Convert a container block to a string.
 */
export function toString(
  container: t.CssDomContainerBlock,
  kind: t.CssDomContainerToStringKind = 'QueryCondition',
): string {
  if (kind === 'QueryCondition') {
    let res = container.kind;
    if (container.name) res += ` ${container.name}`;
    res += ` ${container.condition}`;
    return res;
  }

  if (kind === 'CssSelector') {
    const rules = container.rules.inserted;
    if (rules.length === 0) return `${toString(container, 'QueryCondition')} {}`;
    return rules.map(({ rule }) => rule).join('\n');
  }

  throw new Error(`toString kind value "${kind}" not supported`);
}

/**
 * Helpers
 */
const wrangle = {
  condition(text: string): string {
    text = (text || '').trim();
    if (!text.includes('(')) text = `(${text}`;
    if (!text.includes(')')) text = `${text})`;
    return text;
  },

  selector(selector: string, scope: StringSelector[]) {
    return `${scope.join(' ')} ${selector}`.trim();
  },
} as const;
