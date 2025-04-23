import React from 'react';
import { type t, Color, css, LogoCanvas, MenuList } from './common.ts';

export type RootMenuProps = t.VideoContentProps & {
  onSelect: t.MenuListProps['onSelect'];
};

/**
 * Component:
 */
export const RootMenu: React.FC<RootMenuProps> = (props) => {
  const { content } = props;
  const items = content.media?.children ?? [];

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      PaddingX: 45,
      paddingTop: 60,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
    }),
    canvas: css({ MarginX: 30 }),
    buttons: css({ marginTop: 40 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <LogoCanvas theme={theme.name} style={styles.canvas} />
      <MenuList items={items} onSelect={props.onSelect} style={styles.buttons} />
    </div>
  );
};
