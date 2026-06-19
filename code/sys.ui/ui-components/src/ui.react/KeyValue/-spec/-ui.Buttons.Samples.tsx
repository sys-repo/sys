import React from 'react';
import { Button } from '../../u.ts';
import { type t, Color, css } from './common.ts';
import { SAMPLE, type SampleKind } from './-samples.tsx';

import type { DebugSignals } from './-SPEC.Debug.tsx';

export type SampleButtonsProps = {
  debug: DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
type P = SampleButtonsProps;

/**
 * Sample selector buttons for the KeyValue spec.
 */
export const SampleButtons: React.FC<P> = (props) => {
  const { debug } = props;
  const p = debug.props;

  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg }),
  };

  const selectSample = (kind?: SampleKind) => {
    p.items.value = SAMPLE.items(kind);
    p.sample.value = kind;
  };

  const button = (kind?: SampleKind, label?: string) => {
    const isSelected = p.sample.value === kind;
    const text = label ?? `sample: ${kind}`;
    const prefix = isSelected ? '🌳 ' : '';
    return <Button block label={`${prefix}${text}`} onClick={() => selectSample(kind)} />;
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {button(undefined, '(none)')}
      {button('simple')}
      {button('comprehensive')}
      {button('opacity')}
      {button('links')}
      {button('reorder')}
    </div>
  );
};
