import React, { useCallback, useEffect } from 'react';
import { type t } from './common.ts';
import { Pulldown } from './ui.tsx';

export const usePulldown: t.UsePulldown = (props, timestamp) => {
  const { state, content } = props;
  const render = useCallback(() => <Pulldown {...props} />, [props, timestamp]);

  /**
   * Effect: show/hide.
   */
  useEffect(() => {
    const id = `${content.id}:pulldown`;
    const exists = state.stack.exists((m) => m.id === id);

    if (exists && !timestamp.pulldown) {
      state.stack.pop();
      return;
    }

    if (!exists && timestamp.pulldown) {
      state.stack.push({ id, render });
      return;
    }
  }, [timestamp.pulldown, content.id, render]);

  /**
   * API
   */
  return {
    is: { showing: !!timestamp.pulldown },
  };
};
