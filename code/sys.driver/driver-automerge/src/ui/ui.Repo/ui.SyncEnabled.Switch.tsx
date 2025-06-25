import React from 'react';
import { type t, Color, css, Icons, LocalStorage, Switch } from './common.ts';

type P = t.SyncEnabledSwitchProps;
type Store = { syncEnabled?: boolean };

/**
 * Component:
 */
export const SyncEnabledSwitch: React.FC<P> = (props) => {
  const { repo, localstorage } = props;
  const peerId = repo?.id.peer ?? '';
  const peerParts = peerId.split('-');
  const urls = repo?.sync.urls ?? [];

  /**
   * Hooks:
   */
  const [store, setStore] = React.useState(wrangle.localstore(props));
  const [enabled, setEnabled] = React.useState(
    store?.current.syncEnabled ?? repo?.sync.enabled ?? false,
  );

  /**
   * Effects:
   */
  React.useEffect(() => void setStore(wrangle.localstore(props)), [localstorage]);
  React.useEffect(() => void store?.change((d) => (d.syncEnabled = enabled)), [store, enabled]);
  React.useEffect(() => {
    const next = store?.current.syncEnabled ?? repo?.sync.enabled ?? false;
    updatedEnabled(next);
  }, [urls.join(), repo?.id.instance, repo?.sync.enabled]);

  /**
   * Handlers:
   */
  const updatedEnabled = (enabled: boolean) => {
    if (!repo) return;
    setEnabled(enabled);
    repo.sync.enabled = enabled;
  };
  const toggleEnabled = () => {
    const next = !enabled;
    updatedEnabled(next);
    props.onChange?.({ enabled: next });
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
    body: css({
      display: 'grid',
      gridAutoFlow: 'column',
      gridAutoColumns: 'auto',
      columnGap: 6,
      placeItems: 'center',
    }),
    peer: css({ display: 'grid', gridAutoFlow: 'column', gridAutoColumns: 'auto' }),
    label: css({ opacity: 0.5 }),
    address: css({ opacity: enabled ? 1 : 0.2, transition: 'opacity 120ms ease' }),
    urls: css({}),
  };

  const elPeer = peerId && enabled && (
    <React.Fragment>
      <span className={styles.label.class}>{'•'}</span>
      <div className={styles.peer.class}>
        <span className={styles.label.class}>{`${peerParts.slice(0, -1).join('-')}-`}</span>
        <span>{peerParts.slice(-1)}</span>
      </div>
      <Icons.Person color={theme.fg} size={16} opacity={1} />
    </React.Fragment>
  );

  const tooltip = urls.length > 1 ? urls.reduce((acc, url) => acc + `\n${url}`, '').trim() : '';
  const elUrls = urls.length > 0 && enabled && (
    <div className={styles.urls.class} title={tooltip}>
      {urls[0]}
      {urls.length > 1 && ` (+${urls.length - 1})`}
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class} onMouseDown={toggleEnabled}>
      <div className={styles.body.class}>
        <Switch
          value={enabled}
          theme={theme.name}
          height={16}
          onMouseDown={(e) => {
            e.stopPropagation();
            toggleEnabled();
          }}
        />
        <span className={styles.label.class}>{enabled && elUrls ? 'network:' : 'private'}</span>
        <div className={styles.address.class}>{enabled && elUrls ? elUrls : ``}</div>
        {elPeer}
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
} as const;
