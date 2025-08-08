import React from 'react';

import { type t, Color, css, D } from './common.ts';
import { Body } from './ui.Editor.Body.tsx';
import { Footer } from './ui.Footer.tsx';
import { NotReady } from './ui.NotReady.tsx';
import { useController } from './use.Controller.ts';

type P = t.DevEditorProps;

export const DevEditor: React.FC<P> = (props) => {
  const { debug = false, path, repo, footer = {} } = props;
  const footerVisible = footer.visible ?? D.footer.visible;

  /**
   * Hooks:
   */
  const controller = useController(props);
  const { yaml, signals, doc } = controller;

  /**
   * Effects:
   */
  React.useEffect(() => {
    if (!doc) return;
    props.onDocumentChange?.({ doc });
  }, [doc?.id]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: '1fr auto',
    }),
  };

  const elNoRepo = !repo && <NotReady theme={theme.name} label={'No CRDT repository.'} />;
  const elNoPath = !path && <NotReady theme={theme.name} label={'No document path.'} />;
  const elError = elNoRepo || elNoPath;

  const elMain = elError || <Body {...props} signals={signals} />;
  const elFooter = footerVisible && <Footer theme={theme.name} yaml={yaml} />;

  return (
    <div className={css(styles.base, props.style).class}>
      {elMain}
      {elFooter}
    </div>
  );
};
