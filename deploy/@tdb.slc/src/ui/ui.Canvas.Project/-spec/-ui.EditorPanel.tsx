import { Monaco } from '@sys/driver-monaco';
import React from 'react';

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
  const path = ['project', 'description'];

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
        <Crdt.UI.TextPanel label={'Description'} doc={doc} path={path} />
        {elCloseButton}
      </div>
      <div className={styles.body.class}>
        <Monaco.Editor theme={theme.name} minimap={false} language={'yaml'} />
      </div>
    </div>
  );
};
