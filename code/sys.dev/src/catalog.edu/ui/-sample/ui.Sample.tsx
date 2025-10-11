import React from 'react';
import { type t, Color, css, Monaco, useSlugStructuralDiagnostics } from './common.ts';

export const Sample: React.FC<t.SampleProps> = (props) => {
  const { debug = false, path, bus$, repo, localstorage, signals } = props;

  // Editor ready handles:
  type ReadyCtx = { monaco: t.Monaco.Monaco; editor: t.Monaco.Editor };
  const [ready, setReady] = React.useState<ReadyCtx>();


  const yaml = signals?.yaml?.value;
  const slug = useSlugStructuralDiagnostics({ yaml, path });

  // Attach diagnostic visual-markers when ready:
  Monaco.Yaml.useYamlErrorMarkers({
    enabled: !!ready,
    monaco: ready?.monaco,
    editor: ready?.editor,
    errors: slug.diagnostics,
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ backgroundColor: Color.ruby(debug), color: theme.fg, display: 'grid' }),
  };
  return (
    <div className={css(styles.base, props.style).class}>
      <Monaco.Yaml.Editor
        debug={debug}
        diagnostics={'syntax'}
        theme={theme.name}
        bus$={bus$}
        repo={repo}
        path={path}
        signals={signals}
        editor={{ autoFocus: true }}
        documentId={{ localstorage }}
        onReady={(e) => {
          const { monaco, editor } = e;
          console.info(`⚡️ Monaco.Yaml.Editor:onReady:`, e);
          setReady({ monaco, editor });
          e.$.subscribe((evt) => console.info(`⚡️ Monaco.Yaml.Editor/binding.$:`, evt));
        }}
      />
    </div>
  );
};
