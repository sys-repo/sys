import React from 'react';
import { type t, Color, css, Icons, PathView } from './common.ts';

export type FooterProps = {
  yaml?: t.EditorYaml;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Footer: React.FC<FooterProps> = (props) => {
  const { debug = false, yaml } = props;

  const errors = yaml?.parsed.errors ?? [];
  const hasErrors = errors.length > 0;
  const tooltip = errors.map((err) => err.message).join('\n');

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.alpha(Color.BLACK, theme.is.dark ? 0.18 : 0.02),
      padding: 8,
      paddingLeft: 12,

      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'center',
    }),
    error: css({
      opacity: hasErrors ? 1 : 0,
      transition: 'opacity 120ms ease',
    }),
  };

  const elError = (
    <Icons.Error size={18} color={Color.YELLOW} style={styles.error} tooltip={tooltip} />
  );

  const elPath = (
    <PathView
      prefix={'path:'}
      prefixColor={theme.is.dark ? Color.CYAN : Color.BLUE}
      path={yaml?.cursor.path}
      theme={theme.name}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elPath}
      {elError}
    </div>
  );
};
