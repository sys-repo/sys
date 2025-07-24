import React from 'react';
import { type t, Color, css, D, DocumentId, Monaco, STORAGE_KEY } from './common.ts';

type P = t.SampleProps;

/**
 * Component:
 */
export const EditorsColumn: React.FC<P> = (props) => {
  const { debug = false, repo, signals } = props;
  const doc = signals.doc;


  Monaco.useBinding(signals.editor.value, doc.value, path, (e) => {
    e.binding.$.subscribe((e) => console.info(`⚡️ Sample/crdt:binding.$:`, e));
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: `auto 1fr`,
    }),
    body: css({
      display: 'grid',
    }),
    footer: css({
      backgroundColor: Color.alpha(Color.BLACK, theme.is.dark ? 0.18 : 0.02),
      padding: 8,
      borderTop: `dashed 1px ${Color.alpha(theme.fg, D.borderOpacity)}`,
    }),
  };

  const elCrdt = (
    <DocumentId.View
      background={theme.is.dark ? -0.06 : -0.04}
      theme={theme.name}
      buttonStyle={{ margin: 4 }}
      controller={{
        repo,
        signals: { doc },
        initial: { text: '' },
        localstorage: STORAGE_KEY.DEV,
      }}
    />
  );

  const elBody = (
    <div className={styles.body.class}>
      <Monaco.Editor
        // key={`${v.path?.join('.')}`}
        debug={debug}
        theme={theme.name}
        //
        language={'yaml'}
        autoFocus={true}
        minimap={false}
        //
        onReady={(e) => {
          console.info(`⚡️ MonacoEditor.onReady:`, e);
          signals.editor.value = e.editor;

          // Listeners:
          const path = Monaco.Yaml.Path.observe(e.editor, e.dispose$);
          path.$.subscribe((e) => (signals.path.value = e.path));
        }}
      />
    </div>
  );

  const elFooter = (
    <div className={styles.footer.class}>
      <Monaco.Dev.PathView
        prefix={'path:'}
        prefixColor={theme.is.dark ? Color.CYAN : Color.BLUE}
        path={signals.path.value}
        theme={theme.name}
      />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elCrdt}
      {elBody}
      {elFooter}
    </div>
  );
};
