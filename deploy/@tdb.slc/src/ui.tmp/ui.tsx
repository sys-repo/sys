import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { drawMandelbrot } from './u.mandelbrot.ts';

export const MyMandelbrot: React.FC<t.MyMandelbrotProps> = (props) => {
  const { debug = false, running = D.running } = props;
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!running) return;

    let frameId: number;
    let zoom = 1;

    // Base dimensions in the complex plane:
    const baseWidth = 3.5; // (1 - -2.5)
    const baseHeight = 2; // (1 - -1)
    // A famous "seahorse valley" point for detail:
    const centerX = -0.743643887037151;
    const centerY = 0.13182590420533;

    const optsBase = {
      width: D.canvasWidth,
      height: D.canvasHeight,
      maxIter: D.canvasMaxIter,
      escapeRadius: 2,
    };

    const animate = () => {
      const c = canvasRef.current;
      if (!c) return;

      // shrink the window around (centerX, centerY)
      const dx = baseWidth / zoom;
      const dy = baseHeight / zoom;

      drawMandelbrot(c, {
        ...optsBase,
        xMin: centerX - dx / 2,
        xMax: centerX + dx / 2,
        yMin: centerY - dy / 2,
        yMax: centerY + dy / 2,
      });

      zoom *= 1.02; // 2% closer each frame
      frameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(frameId);
  }, [running]);

  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      display: 'grid',
      placeItems: 'center',
      color: theme.fg,
      backgroundColor: debug ? Color.alpha(theme.fg, 0.1) : undefined,
    }),
    canvas: css({
      width: D.canvasWidth,
      height: D.canvasHeight,
      border: debug ? `1px solid ${theme.fg}` : undefined,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <canvas ref={canvasRef} className={styles.canvas.class} />
    </div>
  );
};
