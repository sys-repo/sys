import React from 'react';
import { type t, Button, Color, css, Signal } from '../common.ts';

let httpRequestNonce = 0;

export type LoadSampleButtonsProps = {
  signal?: t.Signal<t.SampleLoadAction | undefined>;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const LoadSampleButtons: React.FC<LoadSampleButtonsProps> = (props) => {
  const { signal = Signal.create<t.SampleLoadAction>() } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        theme={theme.name}
        block
        label={() => `load: slug-tree ← sample import ${signal.value === 'esm:import' ? '🌳' : ''}`}
        onClick={() => (signal.value = 'esm:import')}
      />
      <Button
        theme={theme.name}
        block
        label={() => `load: slug-tree ← via HTTP ${signal.value === 'http' ? '🌳' : ''}`}
        onClick={() => (signal.value = 'http')}
      />
      <Button
        theme={theme.name}
        block
        label={() => `(unload)`}
        onClick={() => (signal.value = undefined)}
      />
    </div>
  );
};
