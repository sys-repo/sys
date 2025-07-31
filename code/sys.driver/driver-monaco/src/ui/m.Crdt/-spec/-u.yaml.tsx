import { Monaco } from '@sys/driver-monaco';
import { type t, Color, css, Is, Obj, ObjectView } from '../common.ts';

export type YamlSyncDebugProps = {
  monaco?: t.Monaco.Monaco;
  editor?: t.Monaco.Editor;
  doc?: t.Crdt.Ref;
  path?: t.ObjectPath;
  debounce?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export function YamlSyncDebug(props: YamlSyncDebugProps) {
  const { doc, path, editor, monaco } = props;

  /**
   * Hooks:
   */
  const yaml = Monaco.Yaml.useYaml({ monaco, editor, doc, path });
  if (!doc) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = { base: css({}) };

  const name = 'yaml.parsed';
  const data = { ...yaml.parsed, path: yaml.path };
  if (Is.record(data)) Obj.trimStringsDeep(data, { mutate: true });

  const elObject = (
    <ObjectView
      //
      name={name}
      data={data}
      theme={theme.name}
      expand={0}
    />
  );

  return <div className={css(styles.base, props.style).class}>{elObject}</div>;
}
