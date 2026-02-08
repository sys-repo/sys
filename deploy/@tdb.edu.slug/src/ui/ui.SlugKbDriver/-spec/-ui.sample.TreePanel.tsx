import React from 'react';
import { type t, Color, css, Spinners, KeyValue } from './common.ts';

export type FileContentTreePanelProps = {
  data?: t.FileContentData;
  loading?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const FileContentTreePanel: React.FC<FileContentTreePanelProps> = (props) => {
  const { debug = false, loading = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
    body: css({
      padding: 20,
      filter: loading ? `blur(4px) grayscale(100%)` : undefined,
      opacity: loading ? 0.2 : 1,
      transition: 'opacity 100ms ease',

      display: 'grid',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 10,
    }),
    spinner: css({ Absolute: 0, display: 'grid', placeItems: 'center' }),
    empty: css({ opacity: 0.45 }),
  };
  const data = props.data;

  return (
    <div className={css(styles.base, props.style).class}>
      {loading && (
        <div className={styles.spinner.class}>
          <Spinners.Bar theme={theme.name} />
        </div>
      )}
      <div className={styles.body.class}>
        {!loading && !data && <div className={styles.empty.class}>{'No article selected'}</div>}
        {data && (
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
        )}
      </div>
    </div>
  );
};
