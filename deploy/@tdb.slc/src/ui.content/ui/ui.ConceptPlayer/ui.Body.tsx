import React from 'react';
import { type t, Color, css, D, LayoutCenterColumn } from './common.ts';
import { Column } from './ui.Column.tsx';
import { Content } from './ui.Content.tsx';

type P = t.ConceptPlayerProps;

export const Body: React.FC<P> = (props) => {
  const { debug = false } = props;
  const align = props.columnAlign ?? D.columnAlign;
  const columnWidth = props.columnWidth ?? D.columnWidth;
  const isCenter = align === 'Center';

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.alpha(theme.bg, isCenter ? 0 : 1),
      transition: `background-color 150ms`,
      display: 'grid',
    }),
    column: css({
      marginTop: isCenter ? 44 : 0,
      transition: `margin 150ms`,
    }),
    content: css({
      opacity: isCenter ? 0 : 1,
      transition: `opacity 150ms`,
      Absolute: [0, columnWidth, 0, 0],
    }),
  };

  const elColumn = (
    <Column
      debug={debug}
      align={align}
      body={props.columnBody}
      video={props.columnVideo}
      theme={theme.name}
      style={styles.column}
      onClickOutside={props.onClickOutsideColumn}
    />
  );

  const elContent = (
    <Content
      title={props.contentTitle}
      body={props.contentBody}
      style={styles.content}
      onBackClick={props.onBackClick}
    />
  );

  const elGrid = (
    <LayoutCenterColumn
      style={{ Absolute: 0 }}
      align={align}
      centerWidth={columnWidth}
      center={elColumn}
      debug={debug}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elContent}
      {elGrid}
    </div>
  );
};
