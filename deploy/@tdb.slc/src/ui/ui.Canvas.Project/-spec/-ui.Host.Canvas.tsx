import React from 'react';
import { EditorCanvas } from '../../ui.Canvas.Editor/mod.ts';

import { type t, Buttons, Color, css, Signal } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

export type HostCanvasProps = {
  debug: DebugSignals;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const HostCanvas: React.FC<HostCanvasProps> = (props) => {
  const { debug } = props;
  const p = debug.props;

  Signal.useRedrawEffect(() => p.showCanvas.value);
  if (!p.showCanvas.value) return null;

  const v = Signal.toObject(p);
  const theme = Color.theme(v.theme);
  const styles = {
    base: css({
      pointerEvents: 'auto',
      position: 'relative',
      backgroundColor: theme.bg,
      display: 'grid',
      padding: 60,
    }),
    canvas: css({
      backgroundColor: theme.bg,
      boxShadow: `0 0 65px 5px ${Color.format(-0.08)}`,
    }),
  };

  const doc = v.doc;
  const path = ['project', 'panels'];

  const elCloseButton = (
    <Buttons.Icons.Close
      theme={theme.name}
      style={{ Absolute: [4, 5, null, null] }}
      onClick={() => {
        p.showCanvas.value = false;
        p.redraw.value++;
      }}
    />
  );

  return (
    <div className={styles.base.class}>
      <EditorCanvas
        //
        doc={doc}
        path={path}
        theme={v.theme}
        style={styles.canvas}
      />
      {elCloseButton}
    </div>
  );
};
