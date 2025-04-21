import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx, LogoCanvas } from './common.ts';
import { SectionButton } from './ui.Buttons.tsx';

export type IndexProps = t.VideoContentProps & {
  onModuleSelect?: (e: { label: string }) => void;
};

/**
 * Component:
 */
export const Index: React.FC<IndexProps> = (props) => {
  const {} = props;

  const button = (label: string) => {
    return (
      <SectionButton
        label={label}
        onClick={() => {
          console.log('hello');
          props.onModuleSelect?.({ label });
        }}
      />
    );
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      PaddingX: 45,
      paddingTop: 60,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
    }),
    canvas: css({ MarginX: 30 }),
    buttons: css({ marginTop: 40 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <LogoCanvas theme={theme.name} style={styles.canvas} />
      <div className={styles.buttons.class}>
        {button('Getting Started')}
        {button('Customer Model')}
        {button('Impact Model')}
        {button('Economic Model')}
        {button('Key Metrics')}
        {button('Conclusion')}
      </div>
    </div>
  );
};
