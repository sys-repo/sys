import React from 'react';
import { type t, Crdt, Obj, ObjectView, Signal } from '../common.ts';

export type SignalsObjectViewProps = Pick<t.ObjectViewProps, 'expand' | 'name'> & {
  signals?: t.ConceptPlayerSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const SignalsObjectView: React.FC<SignalsObjectViewProps> = (props) => {
  const { signals, name = 'signals' } = props;
  const doc = signals?.doc?.value;

  /**
   * Hooks:
   */
  Signal.useRedrawEffect(() => signals?.doc.value);
  Crdt.UI.useRev(doc);

  /**
   * Data:
   */
  const field = {
    doc: doc ? `doc(crdt:${doc.id.slice(-5)})` : 'doc',
  };
  const data = {
    [field.doc]: Obj.trimStringsDeep(doc?.current),
  };

  /**
   * Render:
   */
  return (
    <ObjectView
      style={props.style}
      theme={props.theme}
      name={name}
      data={data}
      expand={props.expand}
    />
  );
};
