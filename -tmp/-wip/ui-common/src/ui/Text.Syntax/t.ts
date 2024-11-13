import type { t } from './common.ts';

type Color = string | number;

/**
 * Component
 */
export type TextSyntaxTheme = 'Dark' | 'Light';
export type TextSyntaxProps = {
  children?: React.ReactNode;
  text?: string;
  inlineBlock?: boolean;
  tokenizer?: TextSyntaxTokenizer;

  style?: t.CssValue;
  colors?: Partial<TextSyntaxColors>;
  margin?: t.CssValue['Margin'];
  padding?: t.CssValue['Padding'];
  theme?: TextSyntaxTheme;
  fontSize?: t.CssValue['fontSize'];
  fontWeight?: t.CssValue['fontWeight'];
  monospace?: boolean;
  ellipsis?: boolean;
};

/**
 * Tokenization
 */
export type TextSyntaxTokenizer = (text: string) => TextSyntaxTokens;

export type TextSyntaxTokens = {
  text: string;
  parts: TextSyntaxToken[];
};

export type TextSyntaxTokenKind = 'Brace' | 'Predicate' | 'Word' | 'Colon';
export type TextSyntaxBraceKind = '<>' | '{}' | '[]';

export type TextSyntaxToken = {
  text: string;
  kind: TextSyntaxTokenKind;
  within?: TextSyntaxBraceKind;
};

export type TextSyntaxColors = {
  Brace: Color;
  Predicate: Color;
  Colon: Color;
  Word: { Base: Color; Element: Color };
};
