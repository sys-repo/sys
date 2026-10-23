import React from 'react';
import { type t, Button, Color, css, D, Obj, Signal } from './common.ts';

export type PropNavMotionProps = {
  debug: t.DebugSignals;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const PropNavMotion: React.FC<PropNavMotionProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

  const current = v.parts?.nav?.motion ?? D.parts.nav.motion;
  const weighted: t.TreeHost.PartNavMotionCustom = {
    kind: 'custom',
    stiffness: 420,
    damping: 20,
    mass: 0.75,
    bounce: 0.28,
  };

  function setMotion(motion: t.TreeHost.PartNavMotion) {
    p.parts.value = {
      ...D.parts,
      ...(p.parts.value ?? {}),
      nav: {
        ...D.parts.nav,
        ...(p.parts.value?.nav ?? {}),
        motion,
      },
    };
  }

  function button(label: string, motion: t.TreeHost.PartNavMotion) {
    const active = Obj.eql(current, motion);
    return (
      <Button
        block
        label={() => `nav.motion: ${label}${active ? ' *' : ''}`}
        onClick={() => setMotion(motion)}
      />
    );
  }

  /**
   * Render:
   */
  const theme = Color.theme(v.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {button('gentle', { kind: 'preset', preset: 'gentle' })}
      {button('snappy', { kind: 'preset', preset: 'snappy' })}
      {button('none', { kind: 'preset', preset: 'none' })}
      {button('custom (cartoon)', weighted)}
    </div>
  );
};
