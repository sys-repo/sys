import React from 'react';
import { type t, Button, Color, css, KeyValue, Signal } from './common.ts';
import { baseUrl } from './u.http.ts';

export type LoadSampleButtonsProps = {
  signal?: t.Signal<t.SampleLoadAction | undefined>;
  baseUrl?: t.StringUrl;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const LoadSampleButtons: React.FC<LoadSampleButtonsProps> = (props) => {
  const { signal = Signal.create<t.SampleLoadAction>() } = props;
  const current = signal.value;
  const isLoaded = !!current;

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
    const isSelected = value === current;
    const btn = (
      <Button
        label={`${label} ${isSelected ? '🌳' : ''}`}
        style={{ fontWeight: isSelected ? 'bold' : undefined }}
        onClick={() => (signal.value = value)}
      />
    );
    items.push({ k: 'slug-tree:', v: btn, mono });
  }

  items.push({
    k: (
      <Button
        label={isLoaded ? '(unload)' : '(unloaded)'}
        enabled={isLoaded}
        onClick={() => (signal.value = undefined)}
      />
    ),
  });

  add(`load via import (embedded)`, 'esm:import');
  add(`load via HTTP`, 'http');

  const elUrl = <span className={styles.url.class}>{props.baseUrl ?? baseUrl}</span>;
  items.push({ k: 'base-url', v: elUrl, mono });

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.UI layout={{ kind: 'table' }} items={items} theme={theme.name} />
    </div>
  );
};
