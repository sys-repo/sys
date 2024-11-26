import type { t } from './common.ts';

export const Util = {
  toColor(colors: t.TextSyntaxColors, tokens: t.TextSyntaxToken[], index: number) {
    const token = tokens[index];
    if (token.kind === 'Word') {
      return token.within || Util.isPredicateValue(tokens, index)
        ? colors.Word.Element
        : colors.Word.Base;
    }
    return colors[token.kind];
  },

  isPredicateValue(tokens: t.TextSyntaxToken[], index: number) {
    return tokens[index - 2]?.kind === 'Predicate' && tokens[index - 1]?.kind === 'Colon';
  },
} as const;
