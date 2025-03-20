import { motion } from 'motion/react';
import React, { useState } from 'react';
import { type t, Color, css, Button } from './common.ts';

type Position = 'Center' | 'Center:Bottom';

export const MyComponent: React.FC<t.MyComponentProps> = (props) => {
  const { text = '🐷 Hello' } = props;
  const [position, setPosition] = useState<Position>('Center');

  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: 'rgba(255, 0, 0, 0.1)', // RED tint
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
    }),

    button: css({ Absolute: [null, 20, 20, null] }),

    subject: css({
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) scale(1)',
      backgroundColor: '#f8a8a8',
      color: '#333',
      Padding: [10, 30],
      boxSizing: 'border-box',
      borderRadius: '8px',
      fontSize: '1.2rem',
      textAlign: 'center',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    }),

    background: css({
      position: 'absolute',
      top: '50%',
      left: '50%',
      // Center it. The animated scale/opacity/top will be applied via Motion.
      transform: 'translate(-50%, -50%)',
      width: '80%', // 80% of this container
      aspectRatio: '16/9', // 16:9 ratio
      backgroundColor: 'white',
      // marginBottom: 500,
      zIndex: 0,
    }),
  };

  // Compute the target animation state based on the position variable.
  const targetState =
    position === 'Center:Bottom'
      ? { top: 'calc(100% - 20px)', transform: 'translate(-50%, -100%) scale(1.2)' }
      : { top: '50%', transform: 'translate(-50%, -50%) scale(1)' };

  // Background fades/scales in behind the subject when at bottom,
  // and remains hidden/zoomed out when the subject is centered.
  const backgroundAnimate =
    position === 'Center:Bottom'
      ? { opacity: 1, scale: 1, top: '50%', transform: 'translate(-50%, calc(-50% - 30px))' }
      : { opacity: 0, scale: 0.8, top: '50%', transform: 'translate(-50%, calc(-50% - 30px))' };

  const elButton = (
    <Button
      label={'Toggle Position'}
      style={styles.button}
      onClick={() => setPosition((prev) => (prev === 'Center' ? 'Center:Bottom' : 'Center'))}
    />
  );

  const elBackground = (
    <motion.div
      className={styles.background.class}
      initial={false} // Prevent initial animation on mount.
      animate={backgroundAnimate}
      transition={{ type: 'spring', stiffness: 200, damping: 15, mass: 0.8 }}
    />
  );

  const elSubject = (
    <motion.div
      className={styles.subject.class}
      initial={false}
      animate={targetState}
      transition={{ type: 'spring', stiffness: 200, damping: 15, mass: 0.8 }}
    >
      {text}
    </motion.div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elBackground}
      {elSubject}
      {elButton}
    </div>
  );
};
