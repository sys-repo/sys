import React from 'react';
import { type t, Color, css, D, Icons, PathView } from './common.ts';
import { Repo } from './ui.Repo.tsx';

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
      gridTemplateColumns: '1fr', //      ← the left flexible column
      gridAutoFlow: 'column', //          ← place items left→right into new columns
      gridAutoColumns: 'max-content', //  ← each extra column sizes to its content (or 'auto')
      alignItems: 'center',
      columnGap: 8,
    }),
    error: css({
      opacity: hasErrors ? 1 : 0,
      transition: 'opacity 120ms ease',
    }),
    path: css({
      minWidth: 0, //         ← allow grid item to be smaller than min-content.
      overflow: 'hidden', //  ← prevent spill when pane collapses
    }),
  };

  const elError = (
    <Icons.Error size={18} color={Color.YELLOW} style={styles.error} tooltip={tooltip} />
  );

  const elPath = (
    <div className={styles.path.class}>
      <PathView
        prefix={'path:'}
        prefixColor={theme.is.dark ? Color.CYAN : Color.BLUE}
        path={path}
        theme={theme.name}
      />
    </div>
  );

  const elRepo = <Repo crdt={crdt} theme={theme.name} />;

  return (
    <div className={css(styles.base, props.style).class}>
      {elPath}
      {elError}
      {elRepo}
    </div>
  );
};
