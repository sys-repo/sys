import React from 'react';
import { type t, Color, Cropmarks, css, D, ObjectView, Player, Signal } from './common.ts';
import { useTimestamp } from './use.Timestamp.ts';

type P = t.ProgrammeMainProps;

/**
 * Component:
 */
export const Main: React.FC<P> = (props) => {
  const { content, state, player, debug = false } = props;

  /**
   * Hooks:
   */
  const timestamp = useTimestamp({ state, player });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
    body: css({ display: 'grid' }),
  };

  const elBody = <div className={styles.body.class}>{timestamp.current?.main}</div>;
  const elDebug = debug && (
    <>
      <ObjectView
        name={`${D.name}.Main`}
        style={{ Absolute: [null, null, 16, 22] }}
        expand={0}
        data={Signal.toObject({
          player: player.src,
          'state:<ProgrammeSignals>': state.props,
          'content:<ProgrammeContent>': content,
          timestamp,
        })}
      />
      <Player.Timestamp.Elapsed.View player={player} abs={[null, 10, 5, null]} show={debug} />
    </>
  );

  const elCropmarks = timestamp.current?.main && (
    <Cropmarks
      theme={props.theme}
      borderOpacity={debug ? 0.2 : 0.02}
      borderColor={debug ? Color.CYAN : undefined}
      size={{ mode: 'fill', margin: [50, 50, 50, 50], x: true, y: true }}
    >
      {elBody}
    </Cropmarks>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elCropmarks}
      {elDebug}
    </div>
  );
};
