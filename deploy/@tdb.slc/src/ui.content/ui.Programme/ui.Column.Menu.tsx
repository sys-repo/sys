import React from 'react';
import { type t, Color, css, LogoCanvas, MenuList, useSizeObserver } from './common.ts';

export type MenuProps = {
  content: t.VideoContent;
  debug?: boolean;
  onSelect: t.MenuListProps['onSelect'];
  theme?: t.CommonTheme;
  style?: t.CssInput;
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
      paddingTop: size.height > 455 ? 60 : 10,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
    }),
    canvas: css({
      MarginX: '18.5%',
      display: size.height > 570 ? 'block' : 'none',
    }),
    menu: css({
      marginTop: 40,
      MarginX: 50,
    }),
  };

  const elCanvas = (
    <LogoCanvas
      theme={theme.name}
      style={styles.canvas}
      onPanelEvent={(e) => console.log(`⚡️ onPanelEvent:${e.type}`, e)}
    />
  );

  const elMenuList = <MenuList items={items} onSelect={props.onSelect} style={styles.menu} />;

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        {elCanvas}
        {elMenuList}
      </div>
      {debug && size.toElement([4, 6, null, null])}
    </div>
  );
};
