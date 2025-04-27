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

  const elBody = (
    <div className={styles.body.class}>
      <div>{timestamp.main}</div>
    </div>
  );

  const elDebug = debug && (
    <>
      <ObjectView
        name={`${D.name}.Main`}
        data={{ props, timestamp }}
        style={{ Absolute: [null, 25, 15, null] }}
        expand={{ level: 1, paths: ['$', '$.timestamp'] }}
      />
      <Player.Timestamp.Elapsed.View player={player} abs={[5, 10, null, null]} show={debug} />
    </>
  );

  const elCropmarks = timestamp.main && (
    <Cropmarks borderOpacity={debug ? 0.05 : 0} theme={props.theme}>
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
