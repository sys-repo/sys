import React from 'react';
import { type t, Color, css, Icons, Signal, useSizeObserver } from './common.ts';
import { Body } from './ui.Body.tsx';
import { Footer } from './ui.Footer.tsx';

export type EntryProps = t.StaticContentProps & {};

/**
 * Component:
 */
export const Entry: React.FC<EntryProps> = (props) => {
  const { state } = props;

  /**
   * Hooks:
   */
  const size = useSizeObserver();
  const isReady = size.ready;

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => {
    state.stack.length;
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      pointerEvents: 'auto',
      display: 'grid',
      gridTemplateRows: '44px 1fr auto',
      opacity: isReady ? 1 : 0,
    }),
    header: css({
      MarginX: 20,
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.06)}`,
      display: 'grid',
      placeItems: 'center',
    }),
    body: css({
      opacity: props.is.top ? 1 : 0,
      transition: 'opacity 200ms',
    }),
    footer: css({
      Absolute: [null, 0, 0, 0],
    }),
  };

  const elHeader = (
    <div className={styles.header.class}>
      <Icons.Add.Plus opacity={0.2} />
    </div>
  );

  const elBody = <Body state={state} theme={theme.name} style={styles.body} />;
  const elFooter = <Footer state={state} theme={theme.name} style={styles.footer} />;

  return (
    <div
      ref={size.ref}
      className={css(styles.base, props.style).class}
      onClick={() => state.stack.clear(1)}
    >
      {elHeader}
      {elBody}
      {elFooter}
    </div>
  );
};
