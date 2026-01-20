import React from 'react';
import { type t, Button, Color, css, Signal, KeyValue } from '../common.ts';
import { baseUrl } from './u.LoadSample.http.ts';

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
  const current = signal.value;
  const isHttp = current === 'http';

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    url: css({ opacity: current === 'http' ? 1 : 0.3 }),
  };

  const mono = true;
  const items: t.KeyValueItem[] = [{ kind: 'title', v: 'Slug Data' }];

  function add(label: string, value: t.SampleLoadAction) {
    const selected = value === current;
    const btn = (
      <Button
        label={`${label} ${selected ? '🌳' : ''}`}
        style={{ fontWeight: selected ? 'bold' : undefined }}
        onClick={() => (signal.value = value)}
      />
    );
    items.push({ k: 'slug-tree:', v: btn, mono });
  }

  items.push({ k: 'baseUrl', v: <span className={styles.url.class}>{baseUrl}</span>, mono });
  add(`load via HTTP`, 'http');
  add(`load via import (embedded)`, 'esm:import');

  items.push({
    k: <Button label={'(unload)'} onClick={() => (signal.value = undefined)} />,
  });

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.UI layout={{ kind: 'table' }} items={items} theme={theme.name} />
    </div>
  );
};
