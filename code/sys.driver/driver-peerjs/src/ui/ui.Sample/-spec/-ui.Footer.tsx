import React from 'react';
import { type t, Color, Crdt, css, Icons, Obj } from '../common.ts';
import { TextEditor } from '@sys/driver-prosemirror';

export type HostFooterProps = {
  doc?: t.Crdt.Ref;
  path?: t.ObjectPath;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const HostFooter: React.FC<HostFooterProps> = (props) => {
  const { doc, debug = false } = props;
  const path = props.path ?? ['cmdline', 'text'];

  /**
   * Hooks:
   */
  const [text, setText] = React.useState<string>();

  /**
   * Effect:
   */
  React.useEffect(() => {
    const events = doc?.events();
    const update = () => setText(Obj.Path.get<string>(doc?.current, path));
    events?.path(path).$.subscribe(update);
    update();
    return events?.dispose;
  }, [doc?.id, path.join()]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      borderTop: `dashed 1px ${Color.alpha(theme.fg, 0.15)}`,
      padding: 10,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      columnGap: 6,
    }),
    icon: css({
      opacity: !!text ? 1 : 0.25,
      color: !!text ? Color.BLUE : theme.fg,
      transition: 'opacity 120ms ease, color 120ms ease',
    }),
    textEditor: css({ minHeight: 20, fontSize: 14, top: 2 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Icons.Chevron.Right style={styles.icon} />
      <TextEditor
        doc={doc}
        path={path}
        style={styles.textEditor}
        theme={theme.name}
        singleLine={true}
      />
    </div>
  );
};
