import React from 'react';
import { type t, Color, css, D, Icons, Obj, ObjectView } from './common.ts';

/**
 * Non-blocking validation panel for use in dev harnesses & diagnostics.
 * Renders nothing when there are no errors.
 */
export const ValidationErrors: React.FC<t.ValidationErrorsProps> = (props) => {
  const { debug = false, errors = [], title = D.title } = props;
  if (!errors.length) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      Padding: [20, 25],
      fontSize: 16,
      zIndex: 0,
    }),
    title: css({
      color: Color.YELLOW,
      fontSize: 22,
      lineHeight: '28px',
      marginBottom: '1.1em',
      userSelect: 'none',
    }),
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
    id: css({ fontSize: '0.7em', opacity: 0.5 }),
    path: css({ fontSize: '0.7em' }),
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
        <div className={styles.head.class}></div>
        <div className={styles.head.class}>{'view'}</div>
        <div className={styles.head.class}>{'prop'}</div>
        <div className={styles.head.class}>{'message'}</div>
        {errors.map((e, i) => {
          const key = `${e.id}-${Obj.Path.encode(e.path)}-${i}`;
          return (
            <React.Fragment key={key}>
              <Icons.Error size={16} color={Color.YELLOW} />
              <div className={styles.id.class}>{e.id}</div>
              <div className={styles.path.class}>{e.path.join('.')}</div>
              <div className={styles.message.class}>{e.message}</div>
            </React.Fragment>
          );
        })}
      </div>

      {elDebugObject}
    </div>
  );
};
