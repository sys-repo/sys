import React, { useState } from 'react';
import {
  type t,
  CalcTimestamp,
  Color,
  Cropmarks,
  css,
  D,
  ObjectView,
  Player,
  Signal,
} from './common.ts';
import { CalcSection } from './use.Section.Controller.ts';

export type MainProps = {
  state: t.ProgrammeSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Main: React.FC<MainProps> = (props) => {
  const { state } = props;
  const debug = state.props.debug.value ?? false;
  const player = CalcSection.player(state);

  const [media, setMedia] = useState<t.VideoMediaContent>();
  const [timestamp, setTimestamp] = useState<t.RenderedTimestamp>({});

  /**
   * Effect: render current timestamp content.
   */
  Signal.useEffect(() => {
    const media = CalcSection.media(state).child;
    const player = CalcSection.player(state);
    CalcTimestamp.render(player, media?.timestamps).then((e) => {
      setMedia(media);
      setTimestamp(e);
    });
  });

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
        data={{ props, timestamp }}
        style={{ Absolute: [null, null, 15, 15] }}
        expand={{
          level: 0,
          // paths: ['$', '$.timestamp'],
        }}
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
