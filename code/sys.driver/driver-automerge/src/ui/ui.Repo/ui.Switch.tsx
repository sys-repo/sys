import React from 'react';
import { type t, Color, css, Icons, LocalStorage, Switch } from './common.ts';
import { PeerLabel } from './ui.Switch.Peer.tsx';
import { LabelStyle } from './u.Style.ts';

type P = t.SyncEnabledSwitchProps;
type Store = { syncEnabled?: boolean };

/**
 * Component:
 */
export const SyncEnabledSwitch: React.FC<P> = (props) => {
  const { repo, localstorage } = props;
  const peerId = repo?.id.peer ?? '';
  const urls = repo?.sync.urls ?? [];

  /**
   * Hooks:
   */
  const [store, setStore] = React.useState(wrangle.localstore(props));
  const [enabled, setEnabled] = React.useState(wrangle.enabled(store?.current, repo));

  /**
   * Effects:
   */
  React.useEffect(() => void setStore(wrangle.localstore(props)), [localstorage]);
  React.useEffect(() => void store?.change((d) => (d.syncEnabled = enabled)), [store, enabled]);
  React.useEffect(() => {
    const events = repo?.events();
    events?.$.subscribe((e) => {
      const next = e.after.sync.enabled;
      if (e.before.sync.enabled !== next) updatedEnabled(next);
    });
    updatedEnabled(wrangle.enabled(store?.current, repo));
    return events?.dispose;
  }, [repo?.id.instance]);

  /**
   * Handlers:
   */
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleEnabled();
  };
  const toggleEnabled = () => {
    const next = !enabled;
    updatedEnabled(next);
    props.onChange?.({ enabled: next });
  };
  const updatedEnabled = (enabled: boolean) => {
    setEnabled(!!repo && enabled);
    if (repo) repo.sync.enabled = enabled;
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      justifyContent: 'start',
      userSelect: 'none',
      fontSize: 11,
    }),
    body: css(LabelStyle.base, { columnGap: 6 }),
    label: css({ opacity: 0.5 }),
    address: css({ opacity: enabled ? 1 : 0.2, transition: 'opacity 120ms ease' }),
    urls: css({}),
  };

  const tooltip = urls.length > 1 ? urls.reduce((acc, url) => acc + `\n${url}`, '').trim() : '';
  const elUrls = urls.length > 0 && enabled && (
    <div className={styles.urls.class} title={tooltip}>
      {urls[0]}
      {urls.length > 1 && ` (+${urls.length - 1})`}
    </div>
  );

  const prefix = enabled && elUrls ? 'network:' : repo ? 'private' : 'no repository';

  return (
    <div className={css(styles.base, props.style).class} onMouseDown={toggleEnabled}>
      <div className={styles.body.class}>
        <Switch value={enabled} theme={theme.name} height={16} onMouseDown={onClick} />
        <span className={styles.label.class}>{prefix}</span>
        <div className={styles.address.class}>{enabled && elUrls ? elUrls : ``}</div>
        {peerId && enabled && <span className={styles.label.class}>{'•'}</span>}
        {peerId && enabled && <PeerLabel peerId={peerId} />}
        {peerId && enabled && <Icons.Person color={theme.fg} size={16} opacity={1} />}
      </div>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  localstore(props: P) {
    const { repo, localstorage } = props;
    const syncEnabled = repo?.sync.enabled ?? false;
    if (!localstorage) return;
    else return LocalStorage.immutable<Store>(localstorage, { syncEnabled });
  },

  enabled(store?: Store, repo?: t.CrdtRepo) {
    return store?.syncEnabled ?? repo?.sync.enabled ?? false;
  },
} as const;
