import React from 'react';
import { type t, Color, css, Is, Monaco, Slug, useSlugDiagnostics } from './common.ts';
import { Empty } from './ui.Empty.tsx';

type ReadyCtx = { monaco: t.Monaco.Monaco; editor: t.Monaco.Editor };

/**
 * Sample view showing YAML editing + merged slug diagnostics.
 */
export const Sample: React.FC<t.SampleProps> = (props) => {
  const { debug = false, bus$, repo, localstorage, signals } = props;
  const yaml = signals?.yaml?.value;

  const docPath: t.ObjectPath = props.docPath ?? []; //    ← CRDT document location of YAML text.
  const slugPath: t.ObjectPath = props.slugPath ?? []; //  ← path inside YAML to the slug root

  /**
   * Hooks:
   */
  const [ready, setReady] = React.useState<ReadyCtx>();

  // Run combined structural + semantic validation.
  const registry = Slug.Registry.DefaultTraits;
  const { diagnostics } = useSlugDiagnostics(registry, slugPath, yaml);

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

  const empty = (body: string) => <Empty theme={theme.name} children={body} />;
  if (docPath.length === 0) return empty('docPath prop required');
  if (slugPath.length === 0) return empty('docPath prop required');

  return (
    <div className={css(styles.base, props.style).class}>
      <Monaco.Yaml.Editor
        diagnostics="syntax" // Keep the raw YAML syntax diagnostics active.
        theme={theme.name}
        debug={debug}
        bus$={bus$}
        repo={repo}
        path={docPath} // Editor binds to YAML-in-CRDT.
        signals={signals}
        editor={{ autoFocus: true }}
        documentId={{ localstorage }}
        onReady={(e) => {
          const { monaco, editor, dispose$ } = e;
          setReady({ monaco, editor });
          e.$.subscribe((evt) => console.info('Monaco.Yaml.Editor/binding.$:', evt));
          if (repo) Monaco.Crdt.Link.enable({ monaco, editor }, repo, e.dispose$);
        }}
      />
    </div>
  );
};
