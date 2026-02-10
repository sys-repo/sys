import React from 'react';
import { type t, Color, css } from './common.ts';
import { toSlotSpinner } from './u.slot.ts';
import { Spinner } from './ui.SlotHost.Spinner.tsx';

export type SlotHostProps = {
  slot: t.TreeHostSlot;
  host: t.TreeHostProps;
  children?: t.ReactNode;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const SlotHost: React.FC<SlotHostProps> = (props) => {
  const { host, slot } = props;
  const {} = host;
  const spinner = toSlotSpinner(host, slot);

  /**
   * Render:
   */
  const theme = Color.theme(host.theme);
  const styles = {
    base: css({
      position: 'relative',
      display: 'grid',
      minHeight: 0,
      gridTemplateRows: 'minmax(0, 1fr)',
    }),
    spinner: css({ Absolute: 0 }),
    body: css({
      display: 'grid',
      minHeight: 0,
      gridTemplateRows: 'minmax(0, 1fr)',
      filter: !!spinner?.backgroundBlur ? `blur(${spinner.backgroundBlur}px)` : undefined,
      opacity: spinner ? spinner.backgroundOpacity : 1,
      transition: 'opacity 120ms ease',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{props.children}</div>
      {spinner && <Spinner theme={theme.name} config={spinner} style={styles.spinner} />}
    </div>
  );
};
