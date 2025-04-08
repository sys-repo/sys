import React from 'react';
import { factory } from '../factory/mod.tsx';
import { type t, Button, Color, css, Icons, LogoCanvas } from '../ui.ts';
import { Install } from './ui.Install.tsx';

export type EntryProps = t.ContentProps & {};

/**
 * Component:
 */
export const Entry: React.FC<EntryProps> = (props) => {
  const { state, breakpoint } = props;

  /**
   * Handlers:
   */
  const showTrailer = async () => {
    const content = await factory('Trailer');
    state.stack.push(content);
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      pointerEvents: 'auto',
      display: 'grid',
      gridTemplateRows: '44px 1fr auto',
    }),
    header: css({
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
      MarginX: 10,
      display: 'grid',
      placeItems: 'center',
    }),
    body: css({ display: 'grid', placeItems: 'center' }),
    footer: css({ display: breakpoint.name === 'Mobile' ? 'grid' : 'none' }),
    canvas: css({ MarginX: 70 }),
  };

  return (
    <div
      className={css(styles.base, props.style).class}
      onDoubleClick={() => state.stack.clear(1)}
      onClick={() => {
        if (!props.is.top) state.stack.pop(1);
      }}
    >
      <div className={styles.header.class}>
        <Icons.Add.Plus opacity={0.2} />
      </div>
      <div className={styles.body.class}>
        <Button block theme={theme.name} onClick={showTrailer}>
          <LogoCanvas theme={theme.name} style={styles.canvas} />
        </Button>
      </div>
      <div className={styles.footer.class}>
        <Install theme={theme.name} />
      </div>
    </div>
  );
};
