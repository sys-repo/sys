import { useMemo } from 'react';
import { DefaultTokenizer } from './Tokenizer.ts';
import { Util } from './u.ts';
import { Color, DEFAULTS, FC, Style, css, type t } from './common.ts';

/**
 * Label that provides common syntax highlighting.
 */
const View: React.FC<t.TextSyntaxProps> = (props) => {
  const {
    inlineBlock = true,
    ellipsis = true,
    tokenizer = DefaultTokenizer,
    theme = DEFAULTS.theme.default,
    fontSize,
    fontWeight,
    monospace = false,
  } = props;

  const colors = {
    ...(theme === 'Light' ? DEFAULTS.theme.light : DEFAULTS.theme.dark),
    ...props.colors,
  };

  let text = props.text ?? '';
  if (typeof props.children === 'string') {
    if (text) text += ' ';
    text += props.children;
  }

  const tokens: t.TextSyntaxToken[] = useMemo(() => tokenizer(text).parts, [tokenizer, text]);

  /**
   * [Render]
   */
  const styles = {
    base: css({
      display: inlineBlock ? 'inline-block' : undefined,
      fontSize,
      fontWeight,
      fontFamily: monospace ? 'monospace' : undefined,
      ...Style.toPadding(props.padding),
      ...Style.toMargins(props.margin),
    }),
    ellipsis:
      ellipsis &&
      css({
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }),
  };

  const elements = tokens.map((token, i) => {
    const style = { color: Color.format(Util.toColor(colors, tokens, i)) };
    return (
      <span key={i} style={style}>
        {token.text}
      </span>
    );
  });

  return <div {...css(styles.base, styles.ellipsis, props.style)}>{elements}</div>;
};

/**
 * Export
 */
type Fields = { DEFAULTS: typeof DEFAULTS };
export const TextSyntax = FC.decorate<t.TextSyntaxProps, Fields>(
  View,
  { DEFAULTS },
  { displayName: DEFAULTS.displayName },
);
