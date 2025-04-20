import React from 'react';
import { type t, Color, css, Icons, LogoCanvas, LogoWordmark, Signal } from './common.ts';
import { IntroButtons, StartProgrammeButton } from './ui.Buttons.tsx';

export type EntryProps = t.StaticContentProps & {};

const heartRateBPM = 72;
const delay = 60_000 / heartRateBPM; // NB: 60_000 ms in a minute.

/**
 * Component:
 */
export const Entry: React.FC<EntryProps> = (props) => {
  const { state } = props;

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => {
    state.stack.length;
  });

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
    body: css({
      display: 'grid',
      placeItems: 'center',
      opacity: props.is.top ? 1 : 0,
      transition: 'opacity 200ms',
    }),
    brand: {
      base: css({ display: 'grid', placeItems: 'center', rowGap: '35px' }),
      canvas: css({ MarginX: 70 }),
      wordmark: css({ width: 120 }),
    },
  };

  const elHeader = (
    <div className={styles.header.class}>
      <Icons.Add.Plus opacity={0.2} />
    </div>
  );

  const elBody = (
    <div className={styles.body.class}>
      <div className={styles.brand.base.class}>
        <LogoCanvas
          theme={theme.name}
          style={styles.brand.canvas}
          selected={'purpose'}
          selectionAnimation={{ delay, loop: true }}
        />
        <LogoWordmark theme={theme.name} style={styles.brand.wordmark} />
        <IntroButtons theme={theme.name} state={state} style={{ marginTop: 150 }} />
        <div>
          <StartProgrammeButton state={state} theme={theme.name} />
        </div>
      </div>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class} onClick={() => state.stack.clear(1)}>
      {elHeader}
      {elBody}
    </div>
  );
};
