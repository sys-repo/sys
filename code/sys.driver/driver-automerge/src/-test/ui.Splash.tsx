import React from 'react';

import { Card, Crdt } from '@sys/driver-automerge/ui';
import { type t, Button, Color, Cropmarks, css, pkg, Url, useDist } from './common.ts';

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
   * Ref: CRDT.
   */
  const qsSyncServer = Url.parse(location.href).toURL().searchParams.get('ws');
  const isLocalhost = location.hostname === 'localhost';
  const repoRef = React.useRef(
    Crdt.repo({
      storage: { database: 'dev.crdt' },
      network: [
        //
        { ws: 'sync.db.team' },
        // { ws: 'sync.automerge.org' },
        isLocalhost && { ws: 'localhost:3030' },
        qsSyncServer && { ws: qsSyncServer },
      ],
    }),
  );

  /**
   * Hooks:
   */
  const dist = useDist({ sampleFallback: true });

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
    footer: css({ Absolute: [null, 0, 0, 0], fontSize: 11, padding: 10 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.05}>
        <div className={styles.body.class}>
          <Card
            theme={theme.name}
            headerStyle={{ topOffset: -30 }}
            repo={repoRef.current}
            localstorage={`${pkg.name}:splash`}
          />
        </div>
      </Cropmarks>

      <div className={styles.footer.class}>
        {dist && (
          <Button
            theme={theme.name}
            label={() => `version: #${wrangle.versionHash(dist.json)}`}
            onClick={() => window.open('./dist.json', '_blank')}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  versionHash(dist?: t.DistPkg) {
    const hx = dist?.hash.digest ?? '000000';
    return hx.slice(-5);
  },
} as const;
