import React from 'react';
import { type t, Color, css, Icons, Obj } from './common.ts';

export type ValidationErrorsProps = {
  errors?: readonly t.UseFactoryValidateError[];
  title?: string;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Non-blocking validation panel for use in dev harnesses & diagnostics.
 * Renders nothing when there are no errors.
 */
export const ValidationErrors: React.FC<ValidationErrorsProps> = (props) => {
  const { errors = [], title = 'Validation Error' } = props;
  if (!errors.length) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      backgroundColor: Color.alpha(theme.bg, 0.7),
      backdropFilter: `blur(2.6px)`,
      Padding: [20, 25],
      fontSize: 16,
    }),
    title: css({ fontSize: 22, marginBottom: '1.1em', color: Color.YELLOW }),
    head: css({ color: Color.YELLOW }),
    list: css({
      fontSize: 14,
      fontFamily: 'monospace',
      display: 'grid',
      gridTemplateColumns: `auto 1fr 1fr 2fr`,
      rowGap: 10,
      columnGap: 10,
    }),
  };

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
              <div>{e.id}</div>
              <div>{Obj.Path.encode(e.path)}</div>
              <div>{e.message}</div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
