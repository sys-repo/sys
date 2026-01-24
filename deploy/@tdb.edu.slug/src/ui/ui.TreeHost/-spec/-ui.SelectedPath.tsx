import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, D, Rx, Obj, Str, Is, Button, KeyValue } from '../common.ts';

export type SelectedPathProps = {
  title?: string;
  signal?: t.Signal<t.ObjectPath | undefined>;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const SelectedPath: React.FC<SelectedPathProps> = (props) => {
  const { debug = false, signal, title = 'Selected Path' } = props;
  if (!signal) return null;

  const path = signal.value ?? [];
  const hasPath = path.length > 0;

  /**
   * Handlers:
   */
  function segmentHandler(index: number) {
    return () => (signal!.value = path.slice(0, index + 1));
  }

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  const mono = true;
  const items: t.KeyValueItem[] = [{ kind: 'title', v: title }];

  items.push({
    k: (
      <Button
        label={hasPath ? '(root)' : '(empty)'}
        enabled={hasPath}
        onClick={() => (signal.value = undefined)}
      />
    ),
  });

  path.forEach((seg, i) => {
    const isLast = i === path.length - 1;
    const k = `level-${i + 1}`;
    const v = (
      <Button
        label={seg}
        onClick={segmentHandler(i)}
        style={{ fontWeight: isLast ? 'bold' : undefined }}
      />
    );
    items.push({ k, v, mono });
  });

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.UI layout={{ kind: 'table' }} items={items} theme={theme.name} />
    </div>
  );
};
