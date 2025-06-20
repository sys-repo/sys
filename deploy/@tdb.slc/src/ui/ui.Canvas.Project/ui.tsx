import React from 'react';
import { LogoCanvas } from '../ui.Logo.Canvas/mod.ts';
import { type t, Color, css, ObjectView } from './common.ts';

export const CanvasProject: React.FC<t.CanvasProjectProps> = (props) => {
  const { debug = false, doc } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
    }),
    body: css({
      Absolute: 0,
      padding: 15,
      display: 'grid',
      alignContent: 'end',
      justifyContent: 'near',
    }),
    canvas: {
      base: css({
        Absolute: 0,
        display: 'grid',
        placeItems: 'center',
      }),
      logo: css({
        width: 200,
        opacity: doc?.current ? 1 : 0.2,
        transition: 'opacity 120ms ease',
      }),
    },
  };

  const elCanvas = (
    <div className={styles.canvas.base.class}>
      <LogoCanvas theme={theme.name} style={styles.canvas.logo} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elCanvas}
      <div className={styles.body.class}>
        <ObjectView name={'slc.project'} data={doc?.current} theme={theme.name} />
      </div>
    </div>
  );
};
