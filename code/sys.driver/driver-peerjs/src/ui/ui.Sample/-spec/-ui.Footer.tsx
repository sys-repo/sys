import React from 'react';
import { type t, Arr, Color, Crdt, css, Icons, Obj, rx } from '../common.ts';

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
    const update = () => {
      const text = Obj.Path.get<string>(doc?.current, path);
      setText(text);
    };

    events?.$.pipe()
      .pipe(rx.filter((e) => e.patches.some((p) => Arr.startsWith(p.path, path))))
      .subscribe(update);

    update();
    return events?.dispose;
  }, [doc?.id]);

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
      <Crdt.UI.TextEditor
        doc={doc}
        path={path}
        style={styles.textEditor}
        theme={theme.name}
        singleLine={true}
      />
    </div>
  );
};
