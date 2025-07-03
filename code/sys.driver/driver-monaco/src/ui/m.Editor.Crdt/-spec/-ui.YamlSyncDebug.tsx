import type { YamlSyncParserPaths } from '@sys/std/t';

import React from 'react';
import { type t, Color, css, ObjectView, Yaml } from '../common.ts';

export type YamlSyncDebugProps = {
  doc?: t.Crdt.Ref;
  path?: t.ObjectPath;
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

    const syncer = Yaml.syncer(doc, path, { debounce: 300 });
    setSyncPath(syncer.path);

    syncer.$.subscribe((e) => {
      setParseError(e.error);
      setParsed(e.parsed);
    });

    return syncer.dispose;
  }, [doc?.id, (path ?? []).join()]);

  if (!doc) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = { base: css({}) };

  const name = parseError ? 'yaml.error' : `yaml.parsed:/${(syncPath?.target ?? []).join('/')}`;
  const data = parseError ?? parsed;
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
