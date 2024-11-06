import { Style, css, type t } from './common.ts';

type ElementInput = JSX.Element | null | false;

export type CardBodyProps = {
  children?: ElementInput;
  header?: ElementInput;
  footer?: ElementInput;
  padding?: t.CssEdgesInput;
  style?: t.CssValue;
};

export const CardBody: React.FC<CardBodyProps> = (props) => {
  /**
   * [Render]
   */
  const styles = {
    base: css({ position: 'relative' }),
    body: css({
      ...Style.toPadding(props.padding),
      boxSizing: 'border-box',
      display: 'grid',
    }),
    edge: css({
      position: 'relative',
      boxSizing: 'border-box',
    }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      {props.header && <div {...styles.edge}>{props.header}</div>}
      <div {...styles.body}>{props.children}</div>
      {props.footer && <div {...styles.edge}>{props.footer}</div>}
    </div>
  );
};
