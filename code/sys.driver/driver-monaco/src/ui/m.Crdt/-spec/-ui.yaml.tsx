import { Monaco } from '@sys/driver-monaco';
import { YamlObjectView } from '@sys/driver-monaco/dev';

import React from 'react';
import { type t, Bus, Color, css, Obj, ObjectView, Rx, Str } from '../common.ts';

export type YamlSyncDebugProps = {
  bus$: t.EditorEventBus;
  doc?: t.CrdtRef;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export function YamlSyncDebug(props: YamlSyncDebugProps) {
  const { bus$, doc } = props;

  /**
   * Hooks:
   */
  const [rev, setRev] = React.useState(0);
  const [yaml, setYaml] = React.useState<t.YamlSyncParsed>();
  const [cursor, setCursor] = React.useState<t.EditorCursor>();

  React.useEffect(() => {
    const life = Rx.disposable();
    const $ = bus$.pipe(Rx.takeUntil(life.dispose$));

    $.pipe(
      Bus.Filter.ofKind('editor:yaml'),
      Rx.distinctWhile((a, b) => a.rev === b.rev),
      Rx.tap(() => setRev((n) => n + 1)),
    ).subscribe(setYaml);

    $.pipe(
      Bus.Filter.ofKind('editor:yaml:cursor'),
      Rx.distinctWhile((a, b) => Monaco.Is.cursorEqual(a, b)),
      Rx.tap(() => setRev((n) => n + 1)),
    ).subscribe(setCursor);

    return life.dispose;
  }, [bus$]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = { base: css({}) };

  const elObject = (
    <ObjectView
      expand={1}
      theme={theme.name}
      name={'yaml'}
      data={{
        rev,
        yaml: wrangle.yaml(yaml),
        'yaml.cursor': wrangle.cursor(cursor),
        'yaml.cursor.path': cursor ? Str.truncate(wrangle.path(cursor?.path) ?? '', 25) : undefined,
      }}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <YamlObjectView
        yaml={yaml}
        cursor={cursor}
        doc={doc}
        theme={theme.name}
        style={{ marginTop: 5 }}
        expand={1}
      />
    </div>
  );
}

/**
 * Helpers:
 */
const wrangle = {
  yaml(yaml?: t.YamlSyncParsed) {
    if (!yaml) return;
    const path = yaml.path;
    let data = Obj.trimStringsDeep(yaml) as any;
    data.path = {
      source: wrangle.path(path?.source),
      target: wrangle.path(path?.target),
    };
    return data;
  },

  cursor(cursor?: t.EditorCursor) {
    return cursor;
  },

  path(path?: t.ObjectPath | null) {
    if (!path) return '';
    return path.join('/');
  },
} as const;
