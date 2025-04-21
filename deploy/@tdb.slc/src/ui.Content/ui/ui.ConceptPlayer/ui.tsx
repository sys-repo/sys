import React from 'react';
import { type t, Color, css, D, LayoutHGrid, TooSmall, useSizeObserver } from './common.ts';
import { Column } from './ui.Column.tsx';
import { Content } from './ui.Content.tsx';

type P = t.ConceptPlayerProps;

export const ConceptPlayer: React.FC<P> = (props) => {
  const { debug = false } = props;
  const align = wrangle.column(props).align;
  const size = useSizeObserver();
  const isReady = size.ready;
  const isTooSmall = size.width < 960 && size.height < 480;
  const isCenter = align === 'Center';

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      opacity: isReady ? 1 : 0,
      overflow: 'hidden',

      backgroundColor: Color.alpha(theme.bg, isCenter ? 0 : 1),
      transition: `background-color 500ms`,

      display: 'grid',
    }),
    column: css({
      marginTop: isCenter ? 44 : 0,
      transition: `margin 150ms`,
    }),
    content: css({
      opacity: isCenter ? 0 : 1,
      transition: `transition 500ms`,
    }),
  };

  const column = {
    ...wrangle.column(props),
    children: <Column body={props.columnBody} theme={theme.name} style={styles.column} />,
  };

  const elContent = (
    <Content
      title={props.contentTitle}
      body={props.contentBody}
      style={styles.content}
      onBackClick={props.onBackClick}
    />
  );

  const elTooSmall = isTooSmall && <TooSmall theme={theme.name} />;
  const elGrid = !isTooSmall && <LayoutHGrid column={column} left={elContent} debug={debug} />;

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      {elTooSmall || elGrid}
      {debug && size.toElement({ Absolute: [4, 6, null, null] })}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  column(props: P): t.HGridColumn {
    const align = props.columnAlign ?? D.columnAlign;
    const width = D.width;
    return { align, width };
  },
} as const;
