import React from 'react';
import { Button } from '../../u.ts';
import { css, type t } from './common.ts';
import { MarkdownSample, type SampleKind } from './-samples.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

export type SampleButtonsProps = {
  debug: DebugSignals;
  style?: t.CssInput;
};
export type { SampleKind };

export const Sample = {
  Buttons,
  value: MarkdownSample.value,
} as const;

function Buttons(props: SampleButtonsProps) {
  const p = props.debug.props;

  const Styles = {
    base: css({}),
  };

  const button = (kind: SampleKind) => {
    const sample = MarkdownSample.get(kind);
    const selected = p.sample.value === kind;
    const prefix = selected ? '🌳 ' : '';
    return (
      <Button
        key={kind}
        block
        label={`${prefix}${sample.label}`}
        onClick={() => {
          p.sample.value = kind;
          p.value.value = sample.value;
        }}
      />
    );
  };

  return (
    <div className={css(Styles.base, props.style).class}>
      {MarkdownSample.kinds.map((kind) => button(kind))}
    </div>
  );
}
