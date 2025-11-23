import React from 'react';

import { Crdt, Card } from '../-exports/-web.ui/mod.ts';
import {
  type t,
  Button,
  Color,
  Cropmarks,
  css,
  pkg,
  useDist,
  Signal,
  useSizeObserver,
} from './common.ts';

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
  const [doc, setDoc] = React.useState<t.Crdt.Ref>();
  const size = useSizeObserver();
  const dist = useDist({ sampleFallback: true });
  const isSidebarVisible = size.ready && size.width > 1150;

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
      opacity: size.ready ? 1 : 0,
      transition: 'opacity 120ms ease',
      display: 'grid',
      gridTemplateColumns: isSidebarVisible ? '1fr 350px' : '1fr',
    }),
    main: {
      base: css({ display: 'grid' }),
      body: css({ width: 550, height: 350, display: 'grid' }),
      footer: css({ Absolute: [null, 0, 0, 0], fontSize: 11, padding: 10 }),
    },
    sidebar: css({
      borderLeft: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
      padding: 20,
      display: 'grid',
      gridTemplateRows: `auto 1fr auto`,
    }),
  };

  const elMain = (
    <div className={styles.main.base.class}>
      <Cropmarks theme={theme.name} borderOpacity={0.05}>
        <div className={styles.main.body.class}>
          <Card
            theme={theme.name}
            headerStyle={{ topOffset: -30 }}
            repo={repo}
            storageKey={`${pkg.name}:splash`}
            onChange={(e) => {
              console.log('e', e);
              Signal.effect(() => {
                const doc = e.signals.doc.value;
                setDoc(doc);
              });
            }}
          />
        </div>
      </Cropmarks>
      <div className={styles.main.footer.class}>
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

  const elSidebar = isSidebarVisible && (
    <div className={styles.sidebar.class}>
      <Crdt.UI.Repo.Info theme={theme.name} repo={repo} />
      <div />
      <Crdt.UI.Document.Info theme={theme.name} doc={doc} repo={repo} />
    </div>
  );

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      {elMain}
      {elSidebar}
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
