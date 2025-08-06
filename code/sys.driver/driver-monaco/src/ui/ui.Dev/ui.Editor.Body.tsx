import React from 'react';
import { type t, Color, css, DocumentId, Cropmarks } from './common.ts';

type P = t.DevEditorProps;

/**
 * Component:
 */
export const Body: React.FC<P> = (props) => {
  const { repo, signals, localstorage, editorMargin = 0 } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
    }),
    editor: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      padding: 10,
    }),
  };

  const elCrdt = (
    <DocumentId.View
      background={theme.is.dark ? -0.06 : -0.04}
      theme={theme.name}
      buttonStyle={{ margin: 4 }}
      controller={{
        repo,
        signals,
        initial: { text: '' },
        localstorage,
      }}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elCrdt}
      <Cropmarks
        theme={theme.name}
        borderOpacity={0.04}
        subjectOnly={editorMargin === 0}
        size={{ mode: 'fill', margin: editorMargin, x: true, y: true }}
      >
      </Cropmarks>
    </div>
  );
};
