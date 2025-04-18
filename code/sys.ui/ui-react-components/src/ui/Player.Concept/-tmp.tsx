import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { type t, rx, Color, css, Button } from './common.ts';

export type OverlayProps = {
  ctx: t.ConceptPlayerProps;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClose: () => void;
};

type P = OverlayProps;

/**
 * Component.
 */
export const Overlay: React.FC<P> = (props) => {
  const {} = props;
  const [el, setEl] = useState<React.ReactElement>();

  useEffect(() => {
    const life = rx.disposable();
    import('./ui.tsx').then(({ ConceptPlayer }) => {
      setEl(<ConceptPlayer {...props.ctx} />);
    });
    return life.dispose;
  }, []);

  /**
   * Render:.
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      Absolute: 0,
      position: 'fixed',
      backgroundColor: theme.bg,
      color: theme.fg,
      zIndex: 9999999,
    }),
    body: css({ Absolute: 20 }),
    close: css({
      Absolute: [null, 10, 10, null],
    }),
  };

  const elBody = (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{el}</div>
      <Button label={'Close'} onClick={props.onClose} style={styles.close} />
    </div>
  );

  return createPortal(elBody, document.body);
};
