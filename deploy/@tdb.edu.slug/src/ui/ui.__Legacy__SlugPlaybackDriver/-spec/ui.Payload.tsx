import React from 'react';
import { type t, Color, css, Effect, ObjectView, PlaybackDriver } from '../common.ts';

export type PayloadProps = {
  controller?: t.SlugPlaybackController;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Payload: React.FC<PayloadProps> = (props) => {
  const { controller, debug = false } = props;
  const state = Effect.useEffectController(controller);

  const bundle = state?.playback?.bundle;
  const snapshot = state?.playback?.snapshot;
  const experience = state?.playback?.experience;
  const resolved = state?.playback?.resolved;
  const beats = experience?.beats ?? [];
  const currentBeat = snapshot?.state.currentBeat;
  const beat = currentBeat != null ? beats[currentBeat] : undefined;
  const payload = beat?.payload;

  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gap: 8,
      padding: 10,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <ObjectView
        theme={theme.name}
        name={'payload'}
        data={payload}
        expand={1}
        style={{ marginBottom: 20 }}
      />

      <PlaybackDriver.Dev.InfoPanel.UI
        theme={theme.name}
        experience={experience}
        bundle={bundle}
        snapshot={snapshot}
        resolved={resolved}
      />
    </div>
  );
};
