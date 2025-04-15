import React from 'react';
import { ElapsedTime } from '../ui.ElapsedTime.tsx';
import { useTimestamps } from '../use.Timestamps.ts';
import { type t, Cropmarks, css, Sheet } from './common.ts';

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
  const gutter = breakpoint.name === 'Desktop' ? 40 : 10;
  const edge: t.SheetMarginInput = [gutter, '1fr', gutter];
  const styles = {
    base: css({ position: 'relative', marginBottom: 218 }),
    body: css({ Absolute: 0, display: 'grid' }),
  };

  const elBody = (
    <div className={styles.body.class}>
      <Cropmarks
        size={{ mode: 'fill', x: true, y: true, margin: [30, 30, 30, 30] }}
        borderOpacity={0.06}
      >
        {timestamp.pulldown}
      </Cropmarks>
    </div>
  );

  return (
    <Sheet
      {...props}
      style={styles.base}
      theme={props.theme}
      edgeMargin={edge}
      orientation={'Top:Down'}
    >
      {elBody}
      <ElapsedTime player={player} abs={[null, 15, 10, null]} show={showElapsed} />
    </Sheet>
  );
};
