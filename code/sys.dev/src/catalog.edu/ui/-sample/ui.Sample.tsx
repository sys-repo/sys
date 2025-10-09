import React from 'react';
import { type t, Color, css, Monaco } from './common.ts';
import { useYamlSlug } from './use.YamlPipeline.ts';

export const Sample: React.FC<t.SampleProps> = (props) => {
  const { debug = false, bus$, repo, path, localstorage, signals } = props;

  // 1) Editor ready handles:
  const [ready, setReady] = React.useState<null | {
    monaco: t.Monaco.Monaco;
    editor: t.Monaco.Editor;
  }>(null);

  const yaml = signals?.yaml?.value;
  const slug = useYamlSlug({ yaml, path });

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
        theme={theme.name}
        bus$={bus$}
        repo={repo}
        path={path}
        signals={signals}
        documentId={{ localstorage }}
        onReady={(e) => {
          setReady({ monaco: e.monaco, editor: e.editor });
          console.info(`⚡️ Monaco.Yaml.Editor:onReady:`, e);
          e.$.subscribe((evt) => console.info(`⚡️ Monaco.Yaml.Editor/binding.$:`, evt));
        }}
      />
    </div>
  );
};
