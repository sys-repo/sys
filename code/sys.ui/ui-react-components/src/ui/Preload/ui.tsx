import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { type t } from './common.ts';

const OFFSCREEN = '-99999px';

export const PreloadPortal: React.FC<t.PreloadPortalProps> = (props) => {
  const { size = [0, 0], description } = props;
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  /**
   * Effect:
   */
  useEffect(() => {
    const el = document.createElement('div');
    el.setAttribute('data-component', 'sys.preload');
    if (description) el.setAttribute('data-description', description);

    el.style.position = 'absolute';
    el.style.left = OFFSCREEN;
    el.style.top = OFFSCREEN;
    el.style.width = `${size[0]}px`;
    el.style.height = `${size[1]}px`;
    el.style.overflow = 'hidden';
    el.style.opacity = '0';

    document.body.appendChild(el);
    setContainer(el);

    const dispose = () => {
      if (el.parentElement) {
        document.body.removeChild(el);
        setContainer(null);
      }
    };

    // Finish up.
    return dispose;
  }, [size.join(), description]);

  /**
   * Render:
   */
  if (!container) return null;
  return createPortal(props.children, container);
};
