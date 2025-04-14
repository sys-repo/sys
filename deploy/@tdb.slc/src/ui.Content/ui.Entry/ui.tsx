import React from 'react';
import { type t, Button, Color, css, Icons, LogoCanvas, LogoWordmark } from '../common.ts';
import { Factory } from '../m.Factory/mod.ts';
import { Install } from './ui.Install.tsx';

export type EntryProps = t.ContentProps & {};

const heartRateBPM = 72;
const delay = 60_000 / heartRateBPM; // NB: 60_000 ms in a minute.

/**
 * Component:
 */
export const Entry: React.FC<EntryProps> = (props) => {
  const { state } = props;
  const breakpoint = state.breakpoint;

  /**
   * Handlers:
   */
  const onCanvasClick = async () => state.stack.push(await Factory.trailer());

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
      MarginX: 10,
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
      display: 'grid',
      placeItems: 'center',
    }),
    body: css({ display: 'grid', placeItems: 'center' }),
    footer: css({ display: breakpoint.name === 'Mobile' ? 'grid' : 'none' }),
    brand: {
      base: css({ display: 'grid', placeItems: 'center', rowGap: '35px' }),
      canvas: css({ MarginX: 70 }),
      wordmark: css({ width: 120 }),
    },
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
        <Button block theme={theme.name} onClick={onCanvasClick}>
          <div className={styles.brand.base.class}>
            <LogoCanvas
              theme={theme.name}
              style={styles.brand.canvas}
              // selected={CanvasPanel.list}
              selected={'purpose'}
              selectionAnimation={{ delay, loop: true }}
            />
            <LogoWordmark theme={theme.name} style={styles.brand.wordmark} />
          </div>
        </Button>
      </div>
      <div className={styles.footer.class}>
        <Install theme={theme.name} />
      </div>
    </div>
  );
};
