import React from 'react';
import { type t, Color, css, LogoCanvas, MenuList, useSizeObserver } from './common.ts';

export type MenuProps = t.VideoContentProps & {
  debug?: boolean;
  onSelect: t.MenuListProps['onSelect'];
};

/**
 * Component:
 */
export const Menu: React.FC<MenuProps> = (props) => {
  const { content, debug = false } = props;
  const items = content.media?.children ?? [];
  const size = useSizeObserver();

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      opacity: size.ready ? 1 : 0,
      display: 'grid',
    }),
    body: css({
      PaddingX: 45,
      paddingTop: size.height > 455 ? 60 : 10,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
    }),
    canvas: css({
      MarginX: 30,
      display: size.height > 570 ? 'block' : 'none',
    }),
    buttons: css({
      marginTop: 40,
    }),
  };

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <LogoCanvas theme={theme.name} style={styles.canvas} />
        <MenuList items={items} onSelect={props.onSelect} style={styles.buttons} />
      </div>
      {debug && size.toElement([4, 6, null, null])}
    </div>
  );
};
