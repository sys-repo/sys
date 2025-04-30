import React, { useState } from 'react';
import { type t, Color, Cropmarks, css, D, ObjectView, Player, rx, Signal } from './common.ts';
import { Calc } from './u.ts';

type P = t.ProgrammeMainProps;

/**
 * Component:
 */
export const Main: React.FC<P> = (props) => {
  const { content, state, media, selected, debug = false } = props;

  const [player, setPlayer] = useState<t.VideoPlayerSignals>();
  const [timestamp, setTimestamp] = useState<t.RenderedTimestamp>({});

  /**
   * Effect: render current timestamp content.
   */
  React.useEffect(() => {
    const life = rx.lifecycle();
    const playlist = Calc.Section.toPlaylist(media);
    const current = playlist[selected ?? 0];
    const player = current?.video;

    Calc.Timestamp.render(player, current?.timestamps).then((e) => {
      if (life.disposed) return;
      setTimestamp(e);
      setPlayer(player);
    });

    return life.dispose;
  }, [selected, media?.id]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
    body: css({ display: 'grid' }),
  };

  const elBody = <div className={styles.body.class}>{timestamp.main}</div>;
  const elDebug = debug && (
    <>
      <ObjectView
        name={`${D.name}.Main`}
        style={{ Absolute: [null, null, 15, 15] }}
        expand={1}
        data={Signal.toObject({
          'state:<ProgrammeSignals>': state.props,
          'content:<ProgrammeContent>': content,
          timestamp,
        })}
      />
      <Player.Timestamp.Elapsed.View player={player} abs={[null, 10, 5, null]} show={debug} />
    </>
  );

  const elCropmarks = timestamp.main && (
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
