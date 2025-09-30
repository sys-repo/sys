import { Monaco } from '@sys/driver-monaco';
import { type t, Color, css, Is, Obj, ObjectView } from '../common.ts';

export type YamlSyncDebugProps = {
  bus$: t.EditorEventBus;
  monaco?: t.Monaco.Monaco;
  editor?: t.Monaco.Editor;
  doc?: t.CrdtRef;
  path?: t.ObjectPath;
  debounce?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export function YamlSyncDebug(props: YamlSyncDebugProps) {
  const { bus$, doc, path, editor, monaco } = props;

  /**
   * Hooks:
   */
  const yaml = Monaco.Yaml.useYaml({ bus$, monaco, editor, doc, path });
  if (!doc) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = { base: css({}) };

  const data = { ...yaml.parsed, path: yaml.path };
  if (Is.record(data)) Obj.trimStringsDeep(data, { mutate: true });

  const elObject = (
    <ObjectView
      //
      name={'yaml'}
      data={data}
      theme={theme.name}
      expand={1}
    />
  );

  return <div className={css(styles.base, props.style).class}>{elObject}</div>;
}
