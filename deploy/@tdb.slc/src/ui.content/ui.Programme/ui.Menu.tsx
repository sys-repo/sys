import React from 'react';
import { type t, Color, css, LogoCanvas, Obj } from './common.ts';
import { SectionButton } from './ui.Buttons.tsx';

export type MenuListProps = t.VideoContentProps & {
  onModuleSelect?: (e: { label: string }) => void;
};

/**
 * Component:
 */
export const MenuList: React.FC<MenuListProps> = (props) => {
  const { content } = props;

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

  const renderButton = (label: string = 'Untitled') => {
    const onClick = () => props.onModuleSelect?.({ label });
    return <SectionButton key={Obj.hash(label)} label={label} onClick={onClick} />;
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <LogoCanvas theme={theme.name} style={styles.canvas} />
      <div className={styles.buttons.class}>
        {content.media?.children?.map((m) => renderButton(m.title))}
      </div>
    </div>
  );
};
