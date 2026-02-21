import React from 'react';
import { type t, Color, Cropmarks, css, KeyValue, Obj, ObjectView } from './common.ts';
import { toFrontmatter } from './u.data.ts';

export type FileContentProps = {
  file?: t.FileContentData;
  loading?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const FileMain: React.FC<FileContentProps> = (props) => {
  const { loading = false, file } = props;
  if (!file) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = { base: css({ color: theme.fg, display: 'grid' }) };
  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.03}>
        <InfoPanel {...props} style={{ margin: 15, width: 400 }} />
      </Cropmarks>
    </div>
  );
};

/**
 * Component:
 */
export const FileLeaf: React.FC<FileContentProps> = (props) => {
  const { loading = false, file } = props;
  if (!file) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      padding: 20,
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <InfoPanel {...props} showObject={true} />
    </div>
  );
};

/**
 * Component: Information Panel.
 */
type InfoPanelProps = FileContentProps & { showObject?: boolean };
export const InfoPanel: React.FC<InfoPanelProps> = (props) => {
  const { loading = false, showObject = false, file } = props;
  if (!file) return null;

  const frontmatter = toFrontmatter(file.content);
  const ref = file.content.frontmatter.ref;
  const hash = file.content.hash;
  const contentType = file.content.contentType;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      display: 'grid',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 25,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.UI
        theme={theme.name}
        items={[
          { kind: 'title', v: 'File Content' },
          { k: 'ref', v: ref },
          { k: 'hash', v: hash },
          { k: 'content-type', v: contentType },
          ...(loading ? [{ k: 'status', v: 'loading' }] : []),
        ]}
      />
      {frontmatter && (
        <KeyValue.UI
          theme={theme.name}
          items={[
            { kind: 'title', v: 'FrontMatter' },
            ...KeyValue.fromObject(Obj.truncateStrings(frontmatter, 40)),
          ]}
        />
      )}
      {showObject && (
        <ObjectView
          theme={theme.name}
          name={'frontmatter'}
          data={Obj.truncateStrings(frontmatter, 40)}
          expand={0}
        />
      )}
    </div>
  );
};
