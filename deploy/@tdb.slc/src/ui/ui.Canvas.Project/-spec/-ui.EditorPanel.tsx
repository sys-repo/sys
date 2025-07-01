import React, { useRef } from 'react';

import { Monaco } from '@sys/driver-monaco';
import { EditorCrdt } from '@sys/driver-monaco/crdt';
import { type EditorCrdtBinding } from '@sys/driver-monaco/t';

import { type t, Buttons, Color, Crdt, css } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

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
  const bindingRef = useRef<EditorCrdtBinding>();
  const [editor, setEditor] = React.useState<t.Monaco.Editor>();

  /**
   * Effects: setup CRDT databinding.
   */
  React.useEffect(() => {
    bindingRef.current?.dispose();
    if (doc && editor) {
      const path = PATHS.config;
      const binding = EditorCrdt.bind(editor, doc, path);
      binding.$.subscribe((e) => console.info(`⚡️ editor/crdt:binding.$:`, e));
      bindingRef.current = binding;
    }
  }, [editor, doc?.id]);

  if (!doc) return null;

  /**
   * Render:
   */
  const theme = Color.theme(p.theme.value);
  const styles = {
    base: css({
      color: theme.fg,
      background: theme.bg,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
    }),
    body: css({ position: 'relative', display: 'grid' }),
    desc: css({
      position: 'relative',
      height: 100,
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.15)}`,
      Padding: [8, 10],
      display: 'grid',
    }),
  };

  const elCloseButton = (
    <Buttons.Icons.Close
      theme={theme.name}
      style={{ Absolute: [4, 5, null, null] }}
      onClick={() => (p.showEditorPanel.value = false)}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.desc.class}>
        <Crdt.UI.TextPanel
          label={'Description'}
          doc={doc}
          path={PATHS.description}
          theme={theme.name}
        />
        {elCloseButton}
      </div>
      <div className={styles.body.class}>
        <Monaco.Editor
          theme={theme.name}
          minimap={false}
          language={'yaml'}
          onReady={(e) => setEditor(e.editor)}
        />
      </div>
    </div>
  );
};
