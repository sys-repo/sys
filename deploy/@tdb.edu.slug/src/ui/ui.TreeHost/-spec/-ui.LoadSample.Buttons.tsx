import React from 'react';
import { type t, Button, Color, css, Signal, KeyValue } from '../common.ts';

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

  const mono = true;
  const items: t.KeyValueItem[] = [{ kind: 'title', v: 'Sample Data' }];

  function add(key: string, label: string, value: t.SampleLoadAction) {
    const selected = value === signal.value;
    const btn = (
      <Button
        label={`${label} ${selected ? '🌳' : ''}`}
        style={{ fontWeight: selected ? 'bold' : undefined }}
        onClick={() => (signal.value = value)}
      />
    );
    items.push({ k: 'load', v: btn, mono });
  }

  add('tree', `via import`, 'esm:import');
  add('tree', `via HTTP`, 'http');

  items.push({
    k: <Button label={'(unload)'} onClick={() => (signal.value = undefined)} />,
  });

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.UI layout={{ kind: 'table' }} items={items} theme={theme.name} />
    </div>
  );
};
