import React from 'react';
import { type t, Color, css, Sheet, VIDEO, AppContent, Button, DEFAULTS } from './ui.ts';

export function factory() {
  const id: t.ContentStage = 'Entry';
  const content: t.Content = {
    id,

    render(props) {
      const { state } = props;
      const theme = Color.theme(DEFAULTS.theme.base);
      const styles = {
        base: css({
          color: theme.fg,
          display: 'grid',
          placeItems: 'center',
          pointerEvents: 'auto',
        }),
        children: css({ display: 'grid' }),
      };

      const showTrailer = async () => {
        const content = await AppContent.factory('Trailer');
        state.stack.push(content);
      };

      return (
        <div
          className={styles.base.class}
          onDoubleClick={() => state.stack.clear(1)}
          onClick={() => {
            if (!props.isTop) state.stack.pop(1);
          }}
        >
          <Button block theme={theme.name} onClick={showTrailer} label={'Load Trailer'} />
        </div>
      );
    },

    timestamps: {},
  };
  return content;
}
