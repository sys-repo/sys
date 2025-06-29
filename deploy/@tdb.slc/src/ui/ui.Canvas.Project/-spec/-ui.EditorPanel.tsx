import React from 'react';

import { Monaco } from '@sys/driver-monaco';
import { EditorCrdt } from '@sys/driver-monaco/crdt';
import { type EditorCrdtBinding } from '@sys/driver-monaco/t';

import { type t, Button, Color, Crdt, css, Icons } from '../common.ts';
import type { DebugSignals } from './-SPEC.Debug.tsx';

export type EditorPanelProps = {
  debug: DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const EditorPanel: React.FC<EditorPanelProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const doc = p.doc.value;

  /**
   * Hooks/Refs
   */
  const bindingRef = React.useRef<EditorCrdtBinding>();

  if (!doc) return null;

  // 🐷 NB: make this configurable (pass in as props).
  const PATHS = {
    description: ['project', 'description'],
    config: ['project', 'config', 'code'],
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid', gridTemplateRows: 'auto 1fr' }),
    body: css({ position: 'relative', display: 'grid' }),
    closeBtn: css({ Absolute: [4, 5, null, null] }),
    desc: css({
      position: 'relative',
      height: 100,
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.15)}`,
      Padding: [8, 10],
      display: 'grid',
    }),
  };

  const elCloseButton = (
    <Button style={styles.closeBtn} onClick={() => (p.showEditorPanel.value = false)}>
      <Icons.Close size={20} />
    </Button>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.desc.class}>
        <Crdt.UI.TextPanel label={'Description'} doc={doc} path={PATHS.description} />
        {elCloseButton}
      </div>
      <div className={styles.body.class}>
        <Monaco.Editor
          theme={theme.name}
          minimap={false}
          language={'yaml'}
          onReady={(e) => {
            console.info(`⚡️ Monaco.Editor.onReady:`, e);

            // Setup CRDT data-binding.
            bindingRef.current?.dispose();
            if (doc) {
              const path = PATHS.config;
              const binding = EditorCrdt.bind(e.editor, doc, path);
              binding.$.subscribe((e) => console.info(`⚡️ crdt.binding.$:`, e));
              bindingRef.current = binding;
            }
          }}
        />
      </div>
    </div>
  );
};
