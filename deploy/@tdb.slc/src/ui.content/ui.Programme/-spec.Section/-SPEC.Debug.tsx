import type { DebugProps, DebugSignals } from '../-spec/-SPEC.Debug.tsx';

import React from 'react';
import {
  createDebugSignals,
  programmeSectionButtons,
  videoPlayerButton,
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
  const p = debug.state.props;

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
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `theme: ${debug.props.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(debug.props.theme, ['Light', 'Dark'])}
      />

      <hr />
      {videoPlayerButton(debug.player)}

      <hr />
      {programmeSectionButtons(debug.content, debug.state)}

      <hr />
      <ObjectView
        name={'debug'}
        data={Signal.toObject(debug)}
        expand={{ paths: ['$', '$.state', '$.state.component', '$.state.component.props'] }}
        margin={[20, 0]}
      />
    </div>
  );
};
