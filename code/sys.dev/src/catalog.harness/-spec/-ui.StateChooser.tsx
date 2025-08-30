import React, { useEffect, useRef, useState } from 'react';
import { type t, Button, D, Color, css, Signal, rx, Bullet } from './common.ts';

import type { DebugSignals } from './-SPEC.Debug.tsx';

export type StateChooserProps = {
  debug: DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const StateChooser: React.FC<StateChooserProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const selectedKind = p.stateKind.value;

  /**
   * Hooks:
   */
  Signal.useRedrawEffect(() => void p.stateKind.value);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    item: {
      base: css({ display: 'grid' }),
      body: css({
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        alignItems: 'center',
        columnGap: 10,
      }),
    },
  };

  const elList = D.STATE_KINDS.map((kind, i) => {
    const selected = kind === selectedKind;
    const handleSelect = () => (p.stateKind.value = kind);
    return (
      <div key={i} className={styles.item.base.class}>
        <Button onClick={handleSelect}>
          <div className={styles.item.body.class}>
            <Bullet theme={theme.name} selected={selected} />
            <div>{kind}</div>
          </div>
        </Button>
      </div>
    );
  });

  return <div className={css(styles.base, props.style).class}>{elList}</div>;
};
