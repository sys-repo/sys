import { Monaco } from '@sys/driver-monaco';
import { type t, Color, css, Is, Obj, ObjectView } from '../common.ts';

export type YamlSyncDebugProps = {
  editor?: t.Monaco.Editor;
  doc?: t.Crdt.Ref;
  path?: t.ObjectPath;
  debounce?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export function YamlSyncDebug(props: YamlSyncDebugProps) {
  const { doc, path, editor } = props;

  /**
   * Hooks:
   */
  const yaml = Monaco.Yaml.useYaml({ doc, path, editor });
  if (!doc) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = { base: css({}) };

  const name = !yaml.ok ? 'yaml.error' : `yaml.parsed:/${(yaml.path?.target ?? []).join('/')}`;
  const data = yaml.ok ? yaml.parsed.output : yaml.parsed.errors;
  if (Is.record(data)) Obj.trimStringsDeep(data);

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
