import React from 'react';
import { type t, Color, css, LogoCanvas } from './common.ts';
import { SectionButton } from './ui.Buttons.tsx';

export type MenuListProps = t.VideoContentProps & {
  onModuleSelect?: (e: { media: t.VideoMediaContent }) => void;
};

/**
 * Component:
 */
export const MenuList: React.FC<MenuListProps> = (props) => {
  const { content } = props;
  const children = content.media?.children ?? [];

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

  const button = (media: t.VideoMediaContent) => {
    const label = media.title ?? 'Untitled';
    const onClick = () => props.onModuleSelect?.({ media });
    return <SectionButton key={media.id} label={label} onClick={onClick} />;
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <LogoCanvas theme={theme.name} style={styles.canvas} />
      <div className={styles.buttons.class}>{children.map((m) => button(m))}</div>
    </div>
  );
};
