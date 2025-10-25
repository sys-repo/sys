import React from 'react';
import { type t, Obj, ObjectView, Signal, useRev } from '../common.ts';

type P = t.SignalsObjectViewProps;

/**
 * Component:
 */
export const SignalsObjectView: React.FC<P> = (props) => {
  const { signals, name = 'signals' } = props;
  const doc = signals?.doc?.value;

  /**
   * Hooks:
   */
  Signal.useRedrawEffect(() => signals?.doc.value);
  useRev(doc);

  /**
   * Render:
   */
  return (
    <ObjectView
      style={props.style}
      theme={props.theme}
      name={name}
      data={wrangle.data(props)}
      expand={wrangle.expand(props)}
    />
  );
};

/**
 * Helpers:
 */
const wrangle = {
  fields(props: P) {
    const { signals } = props;
    const doc = signals?.doc?.value;
    return {
      doc: doc ? `doc(crdt:${doc.id.slice(-5)})` : 'doc',
    } as const;
  },

  data(props: P) {
    const { signals } = props;
    const doc = signals?.doc?.value;
    const fields = wrangle.fields(props);
    return {
      [fields.doc]: Obj.trimStringsDeep(doc?.current),
    } as const;
  },

  expand(props: P) {
    const { expand } = props;
    if (!!expand) return expand;
    const fields = wrangle.fields(props);
    return ['$', `$.${fields.doc}`];
  },
} as const;
