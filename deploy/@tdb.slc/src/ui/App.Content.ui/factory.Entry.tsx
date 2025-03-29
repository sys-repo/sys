import React from 'react';
import { type t, Color, css, Sheet, VIDEO, AppContent, Button, DEFAULTS } from './ui.ts';

export function factory() {
  const id: t.ContentStage = 'Entry';
  const content: t.Content = {
    id,
    timestamps: {
      '00:00:00.000': {
        render(props) {
          return <Body {...props} />;
        },
      },
    },
  };
  return content;
}

/**
 * Component:
 */
export type BodyProps = t.ContentTimestampProps;
export const Body: React.FC<BodyProps> = (props) => {
  const { state, isTop } = props;

  /**
   * Handlers:
   */
  const onClick = () => {
    state.stack.pop(1);
  };

  const onDoubleClick = () => {
    if (!isTop) state.stack.clear(1);
  };

  const showTrailer = async () => {
    state.stack.push(await AppContent.find('Trailer'));
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      opacity: props.isTop ? 1 : 0.15,
      pointerEvents: 'auto',
      userSelect: 'none',
      transition: `opacity 300ms`,
      padding: 8,
      cursor: 'default',
      display: 'grid',
      placeItems: 'center',
    }),
    body: css({ display: 'grid' }),
  };

  return (
    <div
      className={css(styles.base, props.style).class}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className={styles.body.class}>
        <Button block theme={theme.name} onClick={showTrailer} label={'Load Trailer'} />
      </div>
    </div>
  );
};
