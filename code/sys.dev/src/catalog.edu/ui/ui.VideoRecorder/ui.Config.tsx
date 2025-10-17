import React from 'react';
import { type t, Color, css, Media } from './common.ts';
import { Footer } from './ui.Config.Footer.tsx';

type P = t.VideoRecorderViewProps;

/**
 * Component:
 */
export const Config: React.FC<P> = (props) => {
  const { debug = false, signals = {} } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const edgeBorder = `solid 1px ${Color.alpha(theme.fg, 0.15)}`;
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      borderLeft: edgeBorder,
      minWidth: 340,
      display: 'grid',
      gridTemplateRows: '1fr auto',
    }),
    body: css({
      boxSizing: 'border-box',
      padding: 10,
      paddingTop: 20,
    }),
    footer: css({
      borderTop: edgeBorder,
    }),
    hr: css({
      border: 'none',
      borderTop: `solid 1px ${Color.alpha(theme.fg, 0.15)}`,
      MarginY: 20,
    }),
  };

  const elBody = (
    <div className={styles.body.class}>
      <Media.Devices.UI.List
        filter={(e) => e.kind === 'videoinput'}
        theme={theme.name}
        selected={signals.camera?.value}
        onSelect={(e) => {
          if (signals.camera) signals.camera.value = e.info;
        }}
      />

      <hr className={styles.hr.class} />

      <Media.Devices.UI.List
        filter={(e) => e.kind === 'audioinput'}
        theme={theme.name}
        selected={signals.audio?.value}
        onSelect={(e) => {
          if (signals.audio) signals.audio.value = e.info;
        }}
      />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elBody}
      <Footer {...props} style={styles.footer} />
    </div>
  );
};
