import type { DebugProps, DebugSignals } from '../-spec/-SPEC.Debug.tsx';

import React from 'react';
import {
  createDebugSignals,
  videoPlayerButton,
  configButtonSections,
} from '../-spec/-SPEC.Debug.tsx';
import { type t, Button, css, D, ObjectView, Signal } from '../common.ts';

type P = t.ProgrammeSectionProps;

/**
 * Types:
 */
export { createDebugSignals };
export type { DebugProps, DebugSignals };

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
};

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const c = debug.state.component.props;

  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>
        <span>{D.name}</span>
        <span>{`Section`}</span>
      </div>

      <Button
        block
        label={() => `debug: ${c.debug.value}`}
        onClick={() => Signal.toggle(c.debug)}
      />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      {videoPlayerButton(debug.state.component)}

      <hr />
      {configButtonSections(debug.content, debug.state.component)}

      <hr />
      <ObjectView
        name={'state'}
        data={Signal.toObject(debug)}
        expand={{ paths: ['$', '$.state'] }}
        margin={[20, 0]}
      />
    </div>
  );
};
