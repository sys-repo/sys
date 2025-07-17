import React from 'react';
import { LogoCanvas } from '../ui.Logo.Canvas/mod.ts';
import { type t, Color, Crdt, css, M, ObjectView, Button } from './common.ts';

export const CanvasProject: React.FC<t.CanvasProjectProps> = (props) => {
  const { debug = false, doc } = props;

  /**
   * Effect:
   */
  Crdt.UI.useRedrawEffect(doc);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
    }),
    canvas: {
      base: css({ Absolute: 0, display: 'grid', placeItems: 'center' }),
      logo: css({ width: 200, opacity: doc?.current ? 1 : 0.2, transition: 'opacity 120ms ease' }),
    },
    debugObj: {
      base: css({ Absolute: [null, 0, -17, 15] }),
      body: css({ Absolute: 0 }),
    },
  };

  const elCanvas = (
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

  const elObject = doc && debug && (
    <div className={styles.debugObj.base.class}>
      <div className={styles.debugObj.body.class}>
        <ObjectView
          //
          name={'doc'}
          data={doc?.current}
          theme={theme.name}
          expand={1}
          // expand={['$', '$.project']}
        />
      </div>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elCanvas}
      {elObject}
    </div>
  );
};
