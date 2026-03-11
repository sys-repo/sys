import React from 'react';
import { type t, Color, Crdt, STORAGE_KEY, css } from './common.ts';
import type { DevRepo } from './-u.repo.ts';

export type RepoFooterProps = {
  repo: DevRepo;
  theme?: t.CommonTheme;
};

export const RepoFooter: React.FC<RepoFooterProps> = (props) => {
  const theme = Color.theme(props.theme);
  const border = `solid 1px ${Color.alpha(theme.fg, 0.1)}`;
  const styles = {
    base: css({ position: 'relative', boxSizing: 'border-box' }),
    info: css({ Padding: [15, 15], borderTop: border, borderBottom: border }),
    switch: css({ Padding: [14, 10] }),
  };

  return (
    <div className={styles.base.class}>
      <div className={styles.info.class}>
        <Crdt.UI.Repo.Info repo={props.repo} theme={theme.name} />
      </div>
      <div className={styles.switch.class}>
        <Crdt.UI.Repo.SyncSwitch
          repo={props.repo}
          storageKey={STORAGE_KEY.DEV}
          theme={theme.name}
        />
      </div>
    </div>
  );
};
