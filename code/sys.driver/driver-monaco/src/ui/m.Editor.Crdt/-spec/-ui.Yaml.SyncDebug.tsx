import type { YamlSyncParserPaths } from '@sys/std/t';
import React from 'react';
import { type t, Str, Is, Color, css, Obj, ObjectView, Yaml } from '../common.ts';

export type YamlSyncDebugProps = {
  doc?: t.Crdt.Ref;
  path?: t.ObjectPath;
  debounce?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export function YamlSyncDebug(props: YamlSyncDebugProps) {
  const { doc, path } = props;

  /**
   * Hooks:
   */
  const [parsed, setParsed] = React.useState<any>();
  const [parseError, setParseError] = React.useState<t.StdError>();
  const [syncPath, setSyncPath] = React.useState<YamlSyncParserPaths>();

  /**
   * Effect:
   */
  React.useEffect(() => {
    if (!doc || !path) return;

    const debounce = props.debounce ? 300 : undefined;
    const syncer = Yaml.syncer(doc, path, { debounce });
    setSyncPath(syncer.path);

    const update = (parsed: any, error?: t.StdError) => {
      setParseError(error);
      setParsed(parsed);
    };

    update(syncer.current.parsed(), syncer.errors[0]);
    syncer.$.subscribe((e) => update(e.parsed, e.error));

    return syncer.dispose;
  }, [doc?.id, (path ?? []).join(), props.debounce]);

  if (!doc) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = { base: css({}) };

  const name = parseError ? 'yaml.error' : `yaml.parsed:/${(syncPath?.target ?? []).join('/')}`;
  const data = { ...(parseError ?? parsed) };
  Obj.walk(data, (e) => {
    if (Is.string(e.value)) e.mutate(Str.truncate(e.value, 20));
  });

  const elObject = (
    <ObjectView
      //
      name={name}
      data={data}
      theme={theme.name}
      expand={1}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>{(parsed || parseError) && elObject}</div>
  );
}
