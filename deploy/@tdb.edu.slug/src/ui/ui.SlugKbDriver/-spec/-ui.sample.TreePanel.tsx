import React from 'react';
import { type t, Color, css, Spinners, KeyValue } from './common.ts';

export type FileContentTreePanelProps = {
  data?: t.FileContentData;
  loading?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const FileContentTreePanel: React.FC<FileContentTreePanelProps> = (props) => {
  const { loading = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(0),
      color: theme.fg,
      display: 'grid',
    }),
    body: css({
      padding: 20,
      filter: loading ? `blur(4px) grayscale(100%)` : undefined,
      opacity: loading ? 0.2 : 1,
      transition: 'opacity 100ms ease',
      display: 'grid',
    }),
    rowFlow: css({
      display: 'grid',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 15,
    }),
    spinner: css({ Absolute: 0, display: 'grid', placeItems: 'center' }),
    empty: css({
      fontSize: 12,
      opacity: 0.45,
      display: 'grid',
      placeItems: 'center',
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
    }),
  };
  const data = props.data;

  const elSpinner = loading && (
    <div className={styles.spinner.class}>
      <Spinners.Bar theme={theme.name} />
    </div>
  );

  const elData = data && (
    <div className={styles.rowFlow.class}>
      <KeyValue.UI
        theme={theme.name}
        items={[
          { kind: 'title', v: 'File Content' },
          { k: 'ref', v: data.ref },
          { k: 'hash', v: data.hash },
          { k: 'tree:items', v: data.tree.tree.length },
          { k: 'content-index:entries', v: data.contentIndex.entries.length },
        ]}
      />
      <KeyValue.UI
        theme={theme.name}
        items={[
          { kind: 'title', v: 'FontMatter' },
          ...KeyValue.fromObject(data.content.frontmatter),
        ]}
      />
    </div>
  );

  const elBody = (
    <div className={css(styles.body, styles.rowFlow).class}>
      {!loading && !data && <div className={styles.empty.class}>{'Nothing to display.'}</div>}
      {!loading && elData}
      {/* {data && (
        <KeyValue.UI
          theme={theme.name}
          items={[
            { kind: 'title', v: 'File Content' },
            { k: 'ref', v: data.ref },
            { k: 'hash', v: data.hash },
            { k: 'tree:items', v: data.tree.tree.length },
            { k: 'content-index:entries', v: data.contentIndex.entries.length },
            { kind: 'title', v: 'FrontMatter' },
            ...KeyValue.fromObject(data.content.frontmatter),
          ]}
        />
      )} */}
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elSpinner}
      {elBody}
    </div>
  );
};
