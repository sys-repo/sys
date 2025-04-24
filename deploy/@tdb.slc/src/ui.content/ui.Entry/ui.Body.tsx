import React, { useRef, useState } from 'react';

import { type t, Color, css, LogoCanvas, LogoWordmark } from './common.ts';
import { IntroButtons, StartProgrammeButton } from './ui.Buttons.tsx';

export type BodyProps = {
  state: t.AppSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

const heartRateBPM = 72;
const delay = 60_000 / heartRateBPM; // NB: 60_000 ms in a minute.

type Part = 'Canvas' | 'Workmark';
const PARTS: Part[] = ['Canvas', 'Workmark'] as const;

/**
 * Component:
 */
export const Body: React.FC<BodyProps> = (props) => {
  const { state } = props;

  const readyRef = useRef(new Set<Part>());
  const [, setRender] = useState(0);
  const redraw = () => setRender((n) => n + 1);
  const registerReady = (component: Part) => {
    readyRef.current.add(component);
    redraw();
  };

  const isReady: boolean = PARTS.every((part) => readyRef.current.has(part));

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
          onReady={() => registerReady('Canvas')}
        />
        <LogoWordmark
          theme={theme.name}
          style={styles.brand.wordmark}
          onReady={() => registerReady('Workmark')}
        />
        <IntroButtons theme={theme.name} state={state} style={{ marginTop: 150 }} />
        <div>
          <StartProgrammeButton state={state} theme={theme.name} />
        </div>
      </div>
    </div>
  );
};
