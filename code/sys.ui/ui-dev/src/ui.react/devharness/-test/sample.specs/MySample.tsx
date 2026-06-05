import React from 'react';
import { useKeyboard } from '../../ui.use/mod.ts';
import { type t, Color, css, pkg } from '../common.ts';

export type MySampleProps = {
  text?: string;
  data?: t.Json;
  throwError?: boolean;
  style?: t.CssInput;
  onClick?: () => void;
};

let _count = 0;

export const MySample: React.FC<MySampleProps> = (props) => {
  if (props.throwError) {
    throw new Error('MySample: 🐷 Intentional error');
  }

  useKeyboard();

  /**
   * Render:
   */
  const styles = {
    base: css({
      position: 'relative',
      fontFamily: 'sans-serif',
      display: 'grid',
      placeItems: 'center',
      backdropFilter: 'blur(5px)',
    }),
    body: css({
      position: 'relative',
      border: `dashed 1px ${Color.toGrayAlpha(-0.4)}`,
      boxSizing: 'border-box',
      padding: 15,
      minWidth: 320,
      minHeight: 200,
      borderRadius: 8,
    }),
    render: css({ Absolute: [4, 5, null, null], fontSize: 11, opacity: 0.6 }),
    link: css({ Absolute: [null, 10, 10, null] }),
    data: css({ fontSize: 12 }),
  };

  _count++;
  const elRender = <div className={styles.render.class}>{`render-${_count}`}</div>;

  return (
    <div className={css(styles.base, props.style).class} onClick={props.onClick}>
      <div className={styles.body.class}>
        <div>🐷 {props.text ?? pkg.name}</div>
        <div className={styles.data.class}>
          <pre>state: {props.data ? JSON.stringify(props.data, null, '  ') : 'undefined'} </pre>
        </div>
        <a href={'?dev'} className={styles.link.class}>
          ?dev
        </a>
        {elRender}
      </div>
    </div>
  );
};
