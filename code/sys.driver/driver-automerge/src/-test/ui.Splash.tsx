import React from 'react';

import { Card, Crdt } from '@sys/driver-automerge/ui';
import { type t, Color, Cropmarks, css } from './common.ts';

export type SplashProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Splash: React.FC<SplashProps> = (props) => {
  const {} = props;

  /**
   * Hooks:
   */
  const [signals, setSignals] = React.useState<t.DocumentIdHookSignals>();
  const [repo, setRepo] = React.useState<t.CrdtRepo>();
  const [isSyncEnabled, setSyncEnabled] = React.useState(true);
  const [, setRender] = React.useState(0);
  const redraw = () => setRender((n) => n + 1);

  /**
   * Effects:
   */
  React.useEffect(() => {
    /**
     * Connect to repo:
     */
    const ws = 'sync.db.team';
    const repo = Crdt.repo({
      storage: { database: 'crdt.dev' },
      network: { ws },
    });

    setRepo(repo);
    console.info(`🧫 repo:`, repo);
    if (isSyncEnabled) console.info('└─', `(network/websockets) → endpoint: ${ws}`);
  }, [isSyncEnabled]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme ?? 'Dark');
  const styles = {
    base: css({
      Absolute: 0,
      backgroundColor: theme.bg,
      color: theme.fg,
      fontFamily: 'sans-serif',
      display: 'grid',
    }),
    body: css({ width: 500, height: 350, display: 'grid' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.05}>
        <div className={styles.body.class}>
          <Card
            //
            repo={repo}
            signals={{ doc: signals?.doc }}
            headerStyle={{ topOffset: -30 }}
            theme={theme.name}
            //
            // Sync:
            onSyncEnabledChange={(e) => setSyncEnabled(e.enabled)}
            sync={{
              url: 'sync.db.team', // websockets.
              enabled: isSyncEnabled,
            }}
            // Events:
            onReady={(e) => setSignals(e.signals)}
            onChange={(e) => redraw()}
          />
        </div>
      </Cropmarks>
    </div>
  );
};
