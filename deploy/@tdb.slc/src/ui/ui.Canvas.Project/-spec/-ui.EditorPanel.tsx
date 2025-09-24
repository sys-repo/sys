import React from 'react';

import { Monaco } from '@sys/driver-monaco';

import { type t, Buttons, Color, TextPanel, css } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';
import { DebugFooter } from './-ui.DebugFooter.tsx';

export type EditorPanelProps = {
  debug: DebugSignals;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const EditorPanel: React.FC<EditorPanelProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const doc = p.doc.value;

  // 🐷 NB: make this configurable (pass in as props).
  const PATHS = {
    description: ['project', 'description'],
    config: ['project', 'config', 'yaml'],
  };

  /**
   * Hooks/Refs:
   */
  const [monaco, setMonaco] = React.useState<t.Monaco.Monaco>();
  const [editor, setEditor] = React.useState<t.Monaco.Editor>();

  /**
   * Effects: setup CRDT databinding.
   */
  const path = PATHS.config;
  Monaco.Crdt.useBinding({ monaco, editor, doc, path }, (e) => {
    e.binding.$.subscribe((e) => console.info(`⚡️ editor/crdt:binding.$:`, e));
  });

  if (!doc) return null;

  /**
   * Render:
   */
  const theme = Color.theme(p.theme.value);
  const border = (light: t.Percent, dark: t.Percent) => {
    const color = Color.alpha(theme.fg, theme.is.light ? light : dark);
    return `solid 3px ${color}`;
  };

  const styles = {
    base: css({
      color: theme.fg,
      background: theme.bg,
      borderLeft: border(0.5, 0.15),
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
    }),
    body: css({ position: 'relative', display: 'grid' }),
    desc: css({
      position: 'relative',
      height: 100,
      borderBottom: border(0.5, 0.15),
      Padding: [8, 10],
      display: 'grid',
    }),
    footer: css({
      borderTop: border(0.5, 0.15),
    }),
  };

  const elCloseButton = (
    <Buttons.Icons.Tools
      theme={theme.name}
      style={{ Absolute: [7, 8, null, null] }}
      size={18}
      onClick={() => (p.showEditorPanel.value = false)}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.desc.class}>
        <TextPanel label={'Description'} doc={doc} path={PATHS.description} theme={theme.name} />
        {elCloseButton}
      </div>
      <div className={styles.body.class}>
        <Monaco.Editor
          theme={theme.name}
          minimap={false}
          language={'yaml'}
          onMounted={(e) => {
            setMonaco(e.monaco);
            setEditor(e.editor);
          }}
        />
      </div>
      <div className={styles.footer.class}>
        <DebugFooter debug={debug} />
        {/* <HostFooter repo={repo} theme={p.theme.value} /> */}
      </div>
    </div>
  );
};
