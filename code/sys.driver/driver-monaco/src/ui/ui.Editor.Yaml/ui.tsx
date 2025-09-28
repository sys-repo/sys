import React from 'react';

import { type t, Color, css, D, Rx, useBus, YamlEditorFooter } from './common.ts';
import { Body } from './ui.Body.tsx';
import { NotReady } from './ui.NotReady.tsx';
import { useYamlController } from './use.YamlController.ts';

type P = t.YamlEditorProps;

export const YamlEditor: React.FC<P> = (props) => {
  const { debug = false, path, repo, footer = {} } = props;
  const isFooterVisible = footer.visible ?? D.footer.visible;

  /**
   * Refs:
   */
  const bus$ = useBus(props.bus$);

  /**
   * Hooks:
   */
  const controller = useYamlController(bus$, props);
  const { ready, yaml, signals, doc } = controller;

  /**
   * Effect: Alert listeners when CRDT document-loaded.
   */
  React.useEffect(() => {
    if (!doc) return;
    const { dispose, dispose$ } = Rx.abortable();
    const events = doc.events(dispose$);
    props.onDocumentLoaded?.({ doc, events, dispose$ });
    return dispose;
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
    footer: css({
      backgroundColor: Color.alpha(Color.BLACK, theme.is.dark ? 0.18 : 0.02),
    }),
  };

  const elNoRepo = !repo && <NotReady theme={theme.name} label={'No CRDT repository'} />;
  const elNoPath = !path && <NotReady theme={theme.name} label={'No document path'} />;
  const elError = elNoRepo || elNoPath;

  const elMain = elError || <Body {...props} ready={ready} signals={signals} />;

  const elFooter = (
    <YamlEditorFooter
      theme={theme.name}
      style={styles.footer}
      path={yaml?.cursor.path}
      visible={isFooterVisible}
      crdt={{ repo, visible: footer.repo ?? true }}
      errors={yaml?.parsed.errors}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elMain}
      {elFooter}
    </div>
  );
};
