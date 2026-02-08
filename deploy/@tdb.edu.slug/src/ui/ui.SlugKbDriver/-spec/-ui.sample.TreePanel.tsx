import React from 'react';
import { type t, Color, css, Obj, ObjectView, Spinners, KeyValue } from './common.ts';

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
    obj: css({}),
  };
  const data = Obj.truncateStrings({
    ref: props.data?.ref,
    hash: props.data?.hash,
    treeItems: props.data?.tree.tree.length,
    contentEntries: props.data?.contentIndex.entries.length,
  });

  return (
    <div className={css(styles.base, props.style).class}>
      {loading && (
        <div className={styles.spinner.class}>
          <Spinners.Bar theme={theme.name} />
        </div>
      )}
      <div className={styles.body.class}>
        <ObjectView name={'data'} data={data} expand={0} theme={theme.name} style={styles.obj} />
        <ObjectView
          style={styles.obj}
          name={'data.content'}
          data={Obj.truncateStrings(props.data?.content, 10)}
          expand={0}
          theme={theme.name}
        />
        <ObjectView
          name={'data.content.fontmatter'}
          data={Obj.truncateStrings(props.data?.content.frontmatter, 10)}
          expand={1}
          theme={theme.name}
          style={styles.obj}
        />

        <KeyValue.UI
          theme={theme.name}
          items={[
            { kind: 'title', v: 'FrontMatter' },
            ...KeyValue.fromObject(props.data?.content?.frontmatter, 10),
          ]}
        />
      </div>
    </div>
  );
};
