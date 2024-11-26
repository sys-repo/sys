import { createRoot } from 'react-dom/client';

import { type t, Time } from '../../common.ts';
import { Component } from './Measure.Component.tsx';

/**
 * API for invisibly measuring text.
 */
export const Measure = {
  /**
   * Render and measure the size of the given props.
   */
  size(props: t.MeasureSizeProps) {
    return new Promise<t.Size>((resolve) => {
      const div = document.createElement('DIV');
      div.className = 'tmp.MeasureSize';
      document.body.appendChild(div);

      const dispose = () => {
        document.body.removeChild(div);
        root.unmount();
      };

      const onReady = (size: t.Size) => {
        Time.delay(0, dispose);
        resolve(size);
      };

      const root = createRoot(div);
      root.render(<Component {...props} onReady={onReady} />);
    });
  },
};
