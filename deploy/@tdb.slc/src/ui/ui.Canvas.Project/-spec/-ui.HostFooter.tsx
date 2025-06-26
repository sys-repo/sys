import { type t, css, Color, Crdt, STORAGE_KEY } from '../common.ts';

export function HostFooter(props: { repo: t.CrdtRepo; theme?: t.CommonTheme }) {
  const { repo } = props;

  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      borderTop: `dashed 1px ${Color.alpha(theme.fg, 0.15)}`,
      padding: 12,
    }),
  };
  return (
    <div className={styles.base.class}>
      <Crdt.UI.Repo.SyncEnabledSwitch
        theme={theme.name}
        repo={repo}
        localstorage={STORAGE_KEY.DEV}
      />
    </div>
  );
}
