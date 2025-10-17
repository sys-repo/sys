import React from 'react';
import { type t, Bus, Color, css, ObjectView, Rx, Str, useRev } from '../common.ts';
import { EditorYaml } from '../m.Yaml/mod.ts';

export type YamlObjectViewProps = {
  bus$?: t.EditorEventBus;
  doc?: t.CrdtRef;
  title?: string;
  editor?: t.Monaco.Editor;
  //
  expand?: t.ObjectViewProps['expand'];
  theme?: t.CommonTheme;
  style?: t.CssInput;
  debug?: boolean;
};

type P = YamlObjectViewProps;

/**
 * Dev component that renders a structured <ObjectView view of the
 * current YAML editor state (CRDT doc + YAML parse + cursor position).
 */
export const YamlObjectView: React.FC<P> = (props) => {
  const { debug = false, title = 'editor', editor, bus$, expand = 1 } = props;

  /**
   * Local state:
   */
  const [rev, bump] = useRev();
  const [yaml, setYaml] = React.useState<t.EventYaml | undefined>();
  const [cursor, setCursor] = React.useState<t.EventYamlCursor | undefined>();

  /**
   * Effect: ensure cursor producer exists (singleton per editorId).
   * - Reuses existing producer if already started elsewhere.
   */
  React.useEffect(() => {
    if (!bus$ || !editor) return;
    const ob = EditorYaml.Path.observe({ editor, bus$ });
    return () => ob.dispose();
  }, [bus$, editor]);

  /**
   * Effect: Ping for immediate values on load.
   */
  React.useEffect(() => {
    if (!bus$) return;
    const life = Rx.disposable();

    // Listeners:
    const $ = bus$.pipe(Rx.takeUntil(life.dispose$));
    $.pipe(Bus.Filter.ofKind('editor:yaml'), Rx.tap(bump)).subscribe(setYaml);
    $.pipe(Bus.Filter.ofKind('editor:yaml:cursor'), Rx.tap(bump)).subscribe(setCursor);

    // Initial information request:
    Bus.ping(bus$, ['yaml', 'cursor']);
    return life.dispose;
  }, [bus$, editor]);

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
      <ObjectView
        theme={theme.name}
        name={title}
        data={wrangle.data({ ...props, yaml, cursor }, rev)}
        expand={expand}
      />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  data(props: P & { yaml?: t.EventYaml; cursor?: t.EventYamlCursor }, rev: number) {
    const { doc, cursor, yaml } = props;
    const docField = doc ? `doc(crdt:${doc.id.slice(-5)})` : 'doc';
    const yamlDisplay = !yaml?.path
      ? yaml
      : {
          ...yaml,
          path: {
            source: wrangle.path(yaml.path.source),
            target: wrangle.path(yaml.path.target),
          },
        };
    return {
      rev,
      [docField]: doc?.current,
      yaml: yamlDisplay,
      'yaml.ok': yamlDisplay?.ok ?? null,
      'yaml.cursor': cursor,
      'yaml.cursor.path': wrangle.cursorPath(cursor),
    };
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
