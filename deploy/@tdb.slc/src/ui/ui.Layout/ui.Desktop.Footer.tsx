import React from 'react';
import { type t, Color, App, Button, Cropmarks, css, Signal, LogoWordmark } from './common.ts';

export type DesktopFooterProps = {
  state?: t.AppSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const DesktopFooter: React.FC<DesktopFooterProps> = (props) => {
  const { state } = props;
  const p = state?.props;
  if (!p) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      fontSize: 11,
      padding: 10,
      color: theme.fg,
      display: 'grid',
      gridTemplateColumns: `auto 1fr auto`,
      pointerEvents: 'none',
    }),
    left: css({
      pointerEvents: 'auto',
      display: 'grid',
      gridAutoFlow: 'column',
      alignContent: 'end',
      columnGap: '10px',
    }),
    right: css({ pointerEvents: 'auto' }),
  };

  const elDiv = <div>{'•'}</div>;

  const dist = p.dist.value;
  const elDist = dist && (
    <Button
      theme={theme.name}
      label={() => `version: #${dist.hash.digest.slice(-5)}`}
      onClick={() => window.open('./dist.json', '_blank')}
    />
  );

  const elPdfDownload = (
    <Button
      theme={theme.name}
      label={() => `pdf worksheet`}
      onClick={() => window.open('./pdf/slc.pdf', '_blank')}
    />
  );

  const elLogos = <LogoWordmark logo={'CC'} theme={theme.name} style={{ width: 100 }} />;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.left.class}>
        {elDist}
        {elDiv}
        {elPdfDownload}
      </div>
      <div />
      <div className={styles.right.class}>{elLogos}</div>
    </div>
  );
};
