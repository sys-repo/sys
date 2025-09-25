import React from 'react';
import { type t, Button, Color, css, Signal } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

export type LoadSplashProps = {
  debug: DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const LoadSplash: React.FC<LoadSplashProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(debug.props);

  const hasDoc = !!v.doc;
  const enabled = hasDoc;
  const label = hasDoc ? '🌳 load: (render → true)' : 'loading environment...';

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(),
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        label={label}
        enabled={enabled}
        theme={theme.name}
        onClick={() => (p.render.value = true)}
      />
    </div>
  );
};
