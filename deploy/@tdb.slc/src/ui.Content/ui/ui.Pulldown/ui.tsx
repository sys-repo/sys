import React from 'react';
import { ElapsedTime } from '../ui.ElapsedTime.tsx';
import { useTimestamps } from '../use.Timestamps.ts';
import { type t, css, Sheet } from './common.ts';

export type PullDownProps = t.VideoContentProps;

/**
 * Component:
 */
export const Pulldown: React.FC<PullDownProps> = (props) => {
  const { state, content } = props;
  const { showElapsed = true } = content;

  const player = content.video;
  const breakpoint = state.breakpoint;
  const timestamp = useTimestamps(props, player);

  /**
   * Render:
   */
  const edge: t.SheetMarginInput = breakpoint.name === 'Desktop' ? [30, '1fr', 30] : 0;
  const styles = {
    base: css({ position: 'relative', marginBottom: 218 }),
    body: css({ Absolute: 20, display: 'grid' }),
  };

  return (
    <Sheet
      {...props}
      style={styles.base}
      theme={props.theme}
      edgeMargin={edge}
      orientation={'Top:Down'}
    >
      <div className={styles.body.class}>{timestamp.pulldown}</div>
      <ElapsedTime player={player} abs={true} show={showElapsed} />
    </Sheet>
  );
};
