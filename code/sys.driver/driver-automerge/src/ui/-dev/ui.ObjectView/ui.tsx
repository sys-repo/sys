import React from 'react';
import { type t, Color, css, Is, Obj, ObjectView, Str, useRev } from '../common.ts';
import { toLenses } from './u.ts';

type P = t.CrdtObjectViewProps;

/**
 * Component:
 */
export const CrdtObjectView: React.FC<P> = (props) => {
  const { debug = false, doc, name = 'signals' } = props;

  /**
   * Hooks:
   */
  useRev(doc); // ← redraw on change

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
  data(props: P): Record<string, unknown> {
    const { doc, prepend = {}, append = {} } = props;
    const fields = wrangle.fields(props);
    const lenses = toLenses(props.lenses);

    const current = doc?.current;
    const res = {
      [fields.doc]: Obj.trimStringsDeep(current),
    };

    lenses.forEach((lens: t.CrdtLens) => {
      let value: any = Obj.Path.get(current, lens.path);
      const truncate = 15;
      if (Is.string(value)) value = Str.truncate(value, truncate);
      if (Is.record(value)) value = Obj.trimStringsDeep(value, truncate);
      res[lens.name] = value;
    });

    return { ...prepend, ...res, ...append };
  },

  fields(props: P) {
    const { doc } = props;
    return {
      doc: doc ? `doc(crdt:${doc.id.slice(-5)})` : 'doc',
    } as const;
  },

  expand(props: P) {
    const { expand, lenses } = props;
    if (!!expand) return expand;
    if (!!lenses) return 1;
    const fields = wrangle.fields(props);
    return ['$', `$.${fields.doc}`];
  },
} as const;
