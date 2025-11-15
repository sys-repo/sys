import React from 'react';
import { type t, Color, css, Icons, KeyValue, Str } from './common.ts';
import { getStatus } from './u.status.ts';
import { StatusBullet } from './ui.StatusBullet.tsx';

type P = t.RepoInfoProps;

export const Info: React.FC<P> = (props) => {
  const { debug = false } = props;
  const items = wrangle.items(props);

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
      <KeyValue.View theme={theme.name} mono={true} items={items} />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  items(props: P): t.KeyValueItem[] {
    const { repo, theme } = props;
    if (!repo) return [];

    const status = getStatus(repo);
    const indent = [15, 0] as const;

    const { sync, stores } = repo;
    const rows: t.KeyValueItem[] = [];
    const hr = () => rows.push({ kind: 'hr' });

    rows.push({ k: 'Repo', v: repo.ready ? 'ready' : 'starting...', mono: true });
    rows.push({ k: 'Instance', v: repo.id.instance || '-', mono: true, x: indent });
    rows.push({ k: 'Peer Identity', v: repo.id.peer || '-', mono: true, x: indent });

    hr();

    if (sync.urls.length > 0) {
      const server = <Icons.Network.On size={14} style={{ position: 'relative', top: 3 }} />;

      rows.push({ k: 'Network', v: <StatusBullet theme={theme} status={status} /> });
      sync.urls.forEach((url) => {
        const k = server;
        const v = url;
        rows.push({ k, v: v, x: indent });
      });
    }
    if (stores.length > 0) {
      rows.push({ k: 'Storage', y: [10, 0] });
      stores.forEach((s) => {
        let k = '';
        let v = '';
        if (s.kind === 'fs') {
          k = 'Filesystem';
          v = Str.ellipsize('/path/to/thing'.repeat(100), 20, ' ⋯ ');
        }
        if (s.kind === 'indexed-db') {
          k = 'IndexedDB';
          v = `db:${s.database} / ${s.store}`;
        }
        rows.push({ k, v, x: indent });
      });
    }

    return rows;
  },
} as const;
