import React from 'react';

import { type t } from './common.ts';
import { Pulldown } from './ui.tsx';

export const usePulldown: t.UsePulldown = (props, player, timestamp) => {
  const { state, content } = props;

  const render = React.useCallback(
    () => <Pulldown {...props} player={player} />,
    [props, timestamp],
  );

  /**
   * Effect: show/hide.
   */
  React.useEffect(() => {
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
    player,
  };
};
