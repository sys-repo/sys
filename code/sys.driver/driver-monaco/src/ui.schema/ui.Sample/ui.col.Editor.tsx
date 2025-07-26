import React from 'react';
import { type t, Color, css, D, DocumentId, Monaco, STORAGE_KEY } from './common.ts';
import { Footer } from './ui.col.Editor.Footer.tsx';

type P = t.SampleProps & { yaml: t.EditorYaml };

/**
 * Component:
 */
export const EditorsColumn: React.FC<P> = (props) => {
  const { debug = false, repo, signals, yaml } = props;
  const doc = signals.doc;
  const path = signals['yaml.path'].value;
  const editor = signals.editor.value;

  Monaco.Crdt.useBinding(editor, doc.value, path, (e) => {
    e.binding.$.subscribe((e) => console.info(`⚡️ Sample/crdt:binding.$:`, e));
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid', gridTemplateRows: `auto 1fr` }),
    body: css({ display: 'grid' }),
    footer: css({ borderTop: `dashed 1px ${Color.alpha(theme.fg, D.borderOpacity)}` }),
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
        }}
      />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elCrdt}
      {elBody}
      <Footer {...props} yaml={yaml} style={styles.footer} />
    </div>
  );
};
