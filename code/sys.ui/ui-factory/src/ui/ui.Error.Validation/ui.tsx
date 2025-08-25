import React from 'react';
import { type t, Color, css, D, Icons, Obj, ObjectView } from './common.ts';

/**
 * Non-blocking validation panel for use in dev harnesses & diagnostics.
 * Renders nothing when there are no errors.
 */
export const ValidationErrors: React.FC<t.ValidationErrorsProps> = (props) => {
  const { debug = false, errors = [], title = D.title, backbgroundBlur: blur = D.blur } = props;
  if (!errors.length) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      backgroundColor: Color.alpha(theme.bg, 0.7),
      backdropFilter: `blur(${blur}px)`,
      Padding: [20, 25],
      fontSize: 16,
    }),
    title: css({ fontSize: 22, marginBottom: '1.1em', color: Color.YELLOW }),
    head: css({ color: Color.YELLOW, userSelect: 'none' }),
    list: css({
      fontSize: 14,
      fontFamily: 'monospace',
      display: 'grid',
      gridTemplateColumns: `auto 1fr 1fr 2fr`,
      rowGap: 10,
      columnGap: 10,
      alignItems: 'center',
    }),
    id: css({}),
    path: css({ fontSize: '0.7em', opacity: 0.5 }),
    message: css({}),
    debugObject: css({ marginTop: 30 }),
  };

  const elDebugObject = debug && (
    <ObjectView name={'errors'} data={errors} style={styles.debugObject} theme={theme.name} />
  );

  return (
    <div className={css(styles.base, props.style).class} data-validation>
      <div className={styles.title.class}>{title}</div>

      <div className={styles.list.class}>
        <div className={styles.head.class}>id</div>
        <div className={styles.head.class}></div>
        <div className={styles.head.class}>path</div>
        <div className={styles.head.class}>message</div>
        {errors.map((e, i) => {
          const key = `${e.id}-${Obj.Path.encode(e.path)}-${i}`;
          return (
            <React.Fragment key={key}>
              <Icons.Error size={16} color={Color.YELLOW} />
              <div className={styles.id.class}>{e.id}</div>
              <div className={styles.path.class}>{Obj.Path.encode(e.path)}</div>
              <div className={styles.message.class}>{e.message}</div>
            </React.Fragment>
          );
        })}
      </div>

      {elDebugObject}
    </div>
  );
};
