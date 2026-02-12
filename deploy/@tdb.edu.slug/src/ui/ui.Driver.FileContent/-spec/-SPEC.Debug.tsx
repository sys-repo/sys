import React from 'react';
import { D, type t, Button, Color, css, ObjectView, Signal } from './common.ts';

export type HeadDebugProps = {
  debug: t.DebugSignals;
  style?: t.CssInput;
};

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 4,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
};

/**
 * Component:
 */
export const HeadDebug: React.FC<HeadDebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);

  Signal.useRedrawEffect(debug.listen);

  const theme = Color.theme(v.theme);
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <hr />

      <Button
        block
        label={() => `kind: ${v.cardKind}`}
        onClick={() => (p.cardKind.value = 'file-content')}
      />
      <Button
        block
        label={() => `content: (reset)`}
        onClick={() => debug.orchestrator.content.intent({ type: 'reset' })}
      />
      <ObjectView
        name={'head:file-content'}
        data={{
          selectedRef: debug.orchestrator.selection.current().selectedRef,
          phase: debug.orchestrator.content.current().phase,
          key: debug.orchestrator.content.current().key,
        }}
        expand={0}
        style={{ marginTop: 16 }}
      />
    </div>
  );
};
