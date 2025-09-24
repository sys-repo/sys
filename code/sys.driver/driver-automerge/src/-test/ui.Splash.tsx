import React from 'react';

import { Card } from '@sys/driver-automerge/web/ui';
import { type t, Button, Color, Cropmarks, css, pkg, useDist } from './common.ts';

export type SplashProps = {
  repo?: t.Crdt.Repo;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Splash: React.FC<SplashProps> = (props) => {
  const { repo } = props;

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
    body: css({ width: 550, height: 350, display: 'grid' }),
    footer: css({ Absolute: [null, 0, 0, 0], fontSize: 11, padding: 10 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.05}>
        <div className={styles.body.class}>
          <Card
            theme={theme.name}
            headerStyle={{ topOffset: -30 }}
            repo={repo}
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
