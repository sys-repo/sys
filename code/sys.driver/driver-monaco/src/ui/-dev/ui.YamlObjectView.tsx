import React from 'react';
import { type t, Color, Crdt, css, Obj, ObjectView, Str } from '../common.ts';

export type YamlObjectViewProps = {
  title?: string;
  //
  doc?: t.CrdtRef;
  yaml?: t.YamlSyncParsed;
  cursor?: t.EditorCursor;
  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  expand?: t.ObjectViewProps['expand'];
};

type P = YamlObjectViewProps;

/**
 * Component:
 */
export const YamlObjectView: React.FC<P> = (props) => {
  const { debug = false, title = 'editor', doc, yaml, cursor, expand = 1 } = props;

  /**
   * Hooks:
   */
  const [rev, setRev] = React.useState(0);
  const cursorDeps = React.useMemo(() => Obj.hash(cursor?.path), [cursor?.path]);
  const docRev = Crdt.UI.useRev(doc);

  const increment = () => setRev((n) => n + 1);

  /**
   * Effects:
   */
  React.useEffect(increment, [doc?.instance, yaml?.rev, cursorDeps]);
  React.useEffect(increment, [docRev.rev]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <ObjectView theme={theme.name} name={title} data={wrangle.data(props, rev)} expand={expand} />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  data(props: P, rev: number) {
    const { doc, cursor } = props;
    const docField = doc ? `doc(crdt:${doc.id.slice(-5)})` : 'doc';

    let yaml = props.yaml;

    if (yaml?.path) {
      (yaml as any).path = {
        source: wrangle.path(yaml.path.source),
        target: wrangle.path(yaml.path.target),
      };
    }

    const data = {
      rev,
      yaml,
      'yaml.cursor': cursor,
      'yaml.cursor.path': wrangle.cursorPath(cursor),
      [docField]: doc?.current,
    } as any;

    return data;
  },

  path(path?: t.ObjectPath | null) {
    if (!path) return '';
    const out = Array.isArray(path) ? path.join('/') : path;
    return Str.truncate(out, 25);
  },

  cursorPath(cursor?: t.EditorCursor) {
    return cursor ? wrangle.path(cursor?.path) : undefined;
  },
} as const;
