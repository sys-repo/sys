import React from 'react';
import { LogoCanvas } from '../ui.Logo.Canvas/mod.ts';
import {
  type t,
  Button,
  Color,
  Crdt,
  Cropmarks,
  css,
  M,
  Obj,
  ObjectView,
  Player,
} from './common.ts';

export const CanvasProject: React.FC<t.CanvasProjectProps> = (props) => {
  const { debug = false, doc } = props;

  /**
   * Hooks:
   */
  const [video, setVideo] = React.useState<t.VideoPlayerSignals>();
  const player = Player.Video.useSignals(video);

  /**
   * Effect:
   */
  Crdt.UI.useRedrawEffect(doc);

  React.useEffect(() => {
    setVideo(() => {
      const src = props.video?.src;
      return src ? Player.Video.signals({ src }) : undefined;
    });
  }, [Obj.hash(props.video)]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    canvas: {
      base: css({ Absolute: 0, display: 'grid', placeItems: 'center' }),
      logo: css({ width: 200, opacity: doc?.current ? 1 : 0.2, transition: 'opacity 120ms ease' }),
    },
    debugObj: {
      base: css({ Absolute: [null, 0, -17, 15] }),
      body: css({ Absolute: 0 }),
    },
  };

  const elCanvas = !video && (
    <div className={styles.canvas.base.class}>
      <M.div
        animate={{ scale: doc?.current ? 1.4 : 1 }}
        transition={{ type: 'spring', bounce: 0.45, duration: 0.5 }}
      >
        <Button onClick={props.onCanvasClick}>
          <LogoCanvas theme={theme.name} style={styles.canvas.logo} />
        </Button>
      </M.div>
    </div>
  );

  const elVideo = video && (
    <Cropmarks theme={theme.name}>
      <Player.Video.Element {...player.props} />
    </Cropmarks>
  );

  const elObject = doc && debug && (
    <div className={styles.debugObj.base.class}>
      <div className={styles.debugObj.body.class}>
        <ObjectView
          //
          name={'doc'}
          data={doc?.current}
          theme={theme.name}
          // expand={1}
          // expand={['$', '$.project']}
        />
      </div>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elCanvas}
      {elVideo}
      {elObject}
    </div>
  );
};
