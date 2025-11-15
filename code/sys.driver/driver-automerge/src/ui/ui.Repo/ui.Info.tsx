import React from 'react';
import { type t, Color, css, Icons, KeyValue, Rx, Str, Time } from './common.ts';
import { getStatus } from './u.status.ts';
import { StatusBullet } from './ui.StatusBullet.tsx';

type P = t.RepoInfoProps;

export const Info: React.FC<P> = (props) => {
  const { repo, debug = false } = props;

  const [startupMsecs, setStartupMsecs] = React.useState<t.Msecs | undefined>(undefined);
  const items = wrangle.items(props, startupMsecs);

  /**
   * Effect: track startup elapsed time (msecs).
   */
  React.useEffect(() => {
    if (!repo) return void setStartupMsecs(undefined);

    const timer = Time.timer();
    const ev = repo.events();
    ev.ready$
      .pipe(
        Rx.filter((ready) => ready === true),
        Rx.take(1),
      )
      .subscribe(() => setStartupMsecs(timer.elapsed.msec));

    return ev.dispose;
  }, [repo]);

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
function formatStartupElapsed(startupElapsed?: t.Msecs): string {
  if (typeof startupElapsed !== 'number' || startupElapsed < 0) return '-';
  return Time.duration(startupElapsed).toString();
}

const wrangle = {
  items(props: P, startupElapsedMsecs?: t.Msecs): t.KeyValueItem[] {
    const { repo, theme } = props;
    if (!repo) return [];

    const status = getStatus(repo);
    const msecs = formatStartupElapsed(startupElapsedMsecs);

    const { sync, stores } = repo;
    const rows: t.KeyValueItem[] = [];
    const indent = [15, 0] as const;
    const hr = () => rows.push({ kind: 'hr' });

    rows.push({ k: 'Repo', v: repo.ready ? `ready (${msecs})` : 'starting...', mono: true });
    rows.push({ k: 'Instance', v: repo.id.instance || '-', mono: true, x: indent });
    rows.push({ k: 'Peer Identity', v: repo.id.peer || '-', mono: true, x: indent });

    hr();

    if (sync.urls.length > 0) {
      const server = (
        <Icons.Network.On
          size={14}
          style={{
            position: 'relative',
            display: 'inline-block',
            verticalAlign: 'middle',
            lineHeight: 0,
            top: 2,
          }}
        />
      );

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
