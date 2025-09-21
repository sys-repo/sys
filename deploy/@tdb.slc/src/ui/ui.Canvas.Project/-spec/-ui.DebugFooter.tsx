import type { DebugSignals } from './-SPEC.Debug.tsx';

import { type t, Color, Crdt, css, Is, Obj } from '../common.ts';
import { PATHS } from './-SPEC.Debug.tsx';

export type DebugFooterProps = {
  debug?: DebugSignals;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const DebugFooter: React.FC<DebugFooterProps> = (props) => {
  const { debug } = props;
  const p = debug?.props;

  if (!p) return null;

  /**
   * Render:
   */
  const theme = Color.theme(p.theme.value);
  const styles = {
    base: css({
      color: theme.fg,
      backgroundColor: theme.bg,
    }),
    title: css({
      fontSize: 20,
      padding: 20,
    }),
  };

  const doc = p.doc.value;
  const obj = Obj.Path.get(doc?.current, PATHS.YAML_PARSED, {});
  const title = String(Is.record(obj) ? obj.name : 'Untitled');

  Crdt.UI.useRedrawEffect(doc);

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{title}</div>
    </div>
  );
};
