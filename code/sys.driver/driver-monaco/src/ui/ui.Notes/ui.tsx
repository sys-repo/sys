import React from 'react';
import { type t, Color, css, MonacoEditor, TreeHost } from './common.ts';

type P = t.MonacoNotes.Props;

/**
 * Component:
 */
export const MonacoNotes: React.FC<P> = (props) => {
  const { debug = false } = props;

  const [selectedPath, setSelectedPath] = React.useState<t.ObjectPath | undefined>([
    'notes',
  ]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
    }),
  };

  const elEditor = (
    <MonacoEditor
      minimap={false}
      defaultValue={'# Notes\n'}
      language={'markdown'}
      theme={theme.name}
      wordWrap={props.wordWrap}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <TreeHost.UI
        theme={theme.name}
        tree={TREE}
        selectedPath={selectedPath}
        onPathRequest={(e) => setSelectedPath(e.path)}
        slots={{
          main: { body: elEditor },
        }}
      />
    </div>
  );
};

const TREE: t.TreeHostViewNodeList = [
  {
    path: ['notes'],
    key: '/notes',
    label: 'Notes',
    children: [
      {
        path: ['notes', 'inbox.md'],
        key: '/notes/inbox.md',
        label: 'inbox.md',
        value: { ref: 'inbox.md' },
      },
    ],
  },
];
