import React from 'react';

import { type t, Color, css, LogoCanvas, LogoWordmark, useLoading } from './common.ts';
import { IntroButtons, StartProgrammeButton } from './ui.Buttons.tsx';

export type BodyProps = {
  state: t.AppSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

const heartRateBPM = 72;
const delay = 60_000 / heartRateBPM; // NB: 60_000 ms in a minute.
type Part = 'Canvas' | 'Wordmark';

/**
 * Component:
 */
export const Body: React.FC<BodyProps> = (props) => {
  const { state } = props;

  const loading = useLoading<Part>(['Canvas', 'Wordmark']);
  const isReady = loading.is.complete;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
      opacity: isReady ? 0 : 1,
      transition: 'opacity 200ms',
    }),
    brand: {
      base: css({ display: 'grid', placeItems: 'center', rowGap: '35px' }),
      canvas: css({ MarginX: 70 }),
      wordmark: css({ width: 120 }),
    },
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.brand.base.class}>
        <LogoCanvas
          theme={theme.name}
          style={styles.brand.canvas}
          // selected={'purpose'}
          selectionAnimation={{ delay, loop: true }}
          onReady={() => loading.ready('Canvas')}
        />
        <LogoWordmark
          theme={theme.name}
          style={styles.brand.wordmark}
          onReady={() => loading.ready('Wordmark')}
        />
        <IntroButtons theme={theme.name} state={state} style={{ marginTop: 150 }} />
        <div>
          <StartProgrammeButton state={state} theme={theme.name} />
        </div>
      </div>
    </div>
  );
};
