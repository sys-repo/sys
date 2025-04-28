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

  const [timestamp, setTimestamp] = useState<t.RenderedTimestamp>({});

  /**
   * Effect: render current timestamp content.
   */
  Signal.useEffect(() => {
    const media = CalcSection.media(state);
    const player = CalcSection.player(state);
    CalcTimestamp.render(player, media.child?.timestamps).then((e) => setTimestamp(e));
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
      borderOpacity={debug ? 0.05 : 0}
      theme={props.theme}
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
