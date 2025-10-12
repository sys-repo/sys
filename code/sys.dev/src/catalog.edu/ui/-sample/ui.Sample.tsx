import React from 'react';
import { type t, Color, css, Monaco, Slug, useSlugDiagnostics } from './common.ts';

type ReadyCtx = { monaco: t.Monaco.Monaco; editor: t.Monaco.Editor };

/**
 * Sample view showing YAML editing + merged slug diagnostics.
 */
export const Sample: React.FC<t.SampleProps> = (props) => {
  const { debug = false, bus$, repo, localstorage, signals } = props;
  const yaml = signals?.yaml?.value;
  const path: t.ObjectPath = props.path ?? ['foo']; // TEMP 🐷

  /**
   * Hooks:
   */
  const [ready, setReady] = React.useState<ReadyCtx>();

  // Run combined structural + semantic validation.
  const registry = Slug.Registry.DefaultTraits;
  const { diagnostics } = useSlugDiagnostics({ yaml, path, registry });

  // Push error markers into Monaco.
  Monaco.Yaml.useYamlErrorMarkers({
    enabled: !!ready && !!yaml?.data?.ast,
    monaco: ready?.monaco,
    editor: ready?.editor,
    errors: diagnostics,
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Monaco.Yaml.Editor
        debug={debug}
        diagnostics="syntax" // Keep basic YAML syntax diagnostics active.
        theme={theme.name}
        bus$={bus$}
        repo={repo}
        signals={signals}
        editor={{ autoFocus: true }}
        documentId={{ localstorage }}
        onReady={(e) => {
          setReady({ monaco: e.monaco, editor: e.editor });
          e.$.subscribe((evt) => console.info('Monaco.Yaml.Editor/binding.$:', evt));
        }}
      />
    </div>
  );
};
