import React from 'react';
import { type t, Obj, ObjectView } from '../common.ts';

export type SignalsObjectViewProps = Pick<t.ObjectViewProps, 'expand' | 'name'> & {
  signals?: t.CrdtLayoutSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const SignalsObjectView: React.FC<SignalsObjectViewProps> = (props) => {
  const { signals, name = 'signals' } = props;
  const doc = signals?.doc?.value;
  const field = {
    doc: doc ? `doc(id:..${doc.id.slice(-5)})` : 'doc',
  };

  /**
   * Render:
   */
  return (
    <ObjectView
      style={props.style}
      theme={props.theme}
      name={name}
      data={{ [field.doc]: Obj.trimStringsDeep(doc?.current) }}
      expand={props.expand}
    />
  );
};
