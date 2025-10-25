import React from 'react';
import { type t, Color, css, Is, Obj, ObjectView, Signal, Str, useRev } from '../common.ts';
import { toLenses } from './u.ts';

type P = t.SignalsObjectViewProps;

/**
 * Component:
 */
export const SignalsObjectView: React.FC<P> = (props) => {
  const { debug = false, signals, name = 'signals' } = props;
  const doc = signals?.doc?.value;

  /**
   * Hooks:
   */
  Signal.useRedrawEffect(() => signals?.doc.value);
  useRev(doc);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <ObjectView
        style={props.style}
        theme={props.theme}
        name={name}
        data={wrangle.data(props)}
        expand={wrangle.expand(props)}
      />
    </div>
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

  data(props: P): Record<string, unknown> {
    const { signals } = props;
    const doc = signals?.doc?.value;
    const fields = wrangle.fields(props);
    const lenses = toLenses(props.lenses);

    const current = doc?.current;
    const res = {
      [fields.doc]: Obj.trimStringsDeep(current),
    };

    lenses.forEach((lens: t.SignalsObjectViewLens) => {
      let value: any = Obj.Path.get(current, lens.path);
      const truncate = 20;
      if (Is.string(value)) value = Str.truncate(value, truncate);
      if (Is.record(value)) value = Obj.trimStringsDeep(value, truncate);
      res[lens.field] = value;
    });

    return res;
  },

  expand(props: P) {
    const { expand, lenses } = props;
    if (!!expand) return expand;
    if (!!lenses) return 1;
    const fields = wrangle.fields(props);
    return ['$', `$.${fields.doc}`];
  },
} as const;
