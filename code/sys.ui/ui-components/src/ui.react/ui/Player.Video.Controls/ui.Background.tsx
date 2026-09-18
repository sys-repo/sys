import React from 'react';
import { type t, css, D } from './common.ts';

type P = t.PlayerControlsProps;

/**
 * Component:
 */
export const Background: React.FC<P> = (props) => {
  const bg = props.background ?? {};
  const rounded = bg.rounded ?? D.background.rounded;
  const opacity = Math.max(0, Math.min(1, bg.opacity ?? 0.65));
  const blur = bg.blur ?? 10;
  const shadow = bg.shadow ?? true;

  const styles = {
    base: css({
      display: 'grid',
      position: 'relative',
      color: '#fff',
      borderRadius: rounded,
      overflow: 'hidden',

      backgroundColor: `rgba(0,0,0,${opacity})`,
      backdropFilter: `blur(${blur}px) saturate(120%)`,
      WebkitBackdropFilter: `blur(${blur}px) saturate(120%)`,

      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: shadow ? '0 6px 24px rgba(0,0,0,0.35)' : undefined,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div />
    </div>
  );
};
