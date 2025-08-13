import React from 'react';
import { type t, Color, css, D, Icons, PathView } from './common.ts';

type P = t.YamlEditorFooterProps;

export const YamlEditorFooter: React.FC<P> = (props) => {
  const { debug = false, path, crdt = {}, errors = [], visible = D.visible } = props;

  const hasErrors = errors.length > 0;
  const tooltip = errors
    .map((err) => err.message)
    .join('\n')
    .trim();

  if (!visible) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 8,
      PaddingX: 12,
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
      path={path}
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
