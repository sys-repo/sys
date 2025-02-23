import { useEffect, useState } from 'react';
import { type t, Color, COLORS, css, Hash, Pkg, pkg, rx, Str } from './common.ts';

export type TmpProps = {
  digest?: t.StringHash;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const Tmp: React.FC<TmpProps> = (props) => {
  const [_dist, setDist] = useState<t.DistPkg>();
  const dist: t.DistPkg | undefined = _dist;
  const digest = props.digest ? wrangle.fmtHash(props.digest) : wrangle.digest(dist);

  /**
   * Lifecycle.
   */
  useEffect(() => {
    const { dispose, dispose$ } = rx.disposable();
    (async () => {
      /**
       * GET fetch
       */
      const res = await Pkg.Dist.fetch({ dispose$, disposeReason: 'react:useEffect:dispose' });
      setDist(res.dist);
    })();
    return dispose;
  }, []);

  /**
   * Render
   */
  const theme = Color.theme(props.theme ?? 'Dark');
  const styles = {
    base: css({
      Absolute: 0,
      backgroundColor: COLORS.MAGENTA,
      color: theme.fg,
      fontFamily: 'sans-serif',
    }),
    body: {
      base: css({ Absolute: 0, display: 'grid', placeItems: 'center', userSelect: 'none' }),
      inner: css({ marginBottom: 25 }),
      pig: css({ fontSize: 50 }),
      title: css({ fontSize: 28 }),
    },
    pkg: {
      base: css({
        Absolute: [null, null, 16, digest.display ? 18 : 15],
        fontFamily: 'monospace',
        cursor: 'pointer',
        display: 'grid',
        rowGap: '0.5em',
      }),
      at: css({ MarginX: '0.6em', opacity: 0.5 }),
      version: css({ opacity: 1 }),
      hash: css({ opacity: 0.5 }),
      name: css({}),
    },
    a: css({
      textDecoration: 'none',
      color: theme.fg,
    }),
  };

  const elBody = (
    <div {...styles.body.base}>
      <div {...styles.body.inner}>
        <a {...styles.a} href="./docs">
          <div {...styles.body.pig}>{`🐷`}</div>
          <div {...styles.body.title}>{`Social Lean Canvas`}</div>
        </a>
      </div>
    </div>
  );

  const elHash = digest.display && (
    <div {...styles.pkg.hash} title={digest.tooltip}>
      {digest.display}
    </div>
  );

  const elNameVersion = (
    <div>
      <div>
        <span {...styles.pkg.name}>{pkg.name}</span>
        <span {...styles.pkg.at}>{'@'}</span>
        <span {...styles.pkg.version}>{pkg.version}</span>
      </div>
    </div>
  );

  const elPkg = (
    <div {...styles.pkg.base}>
      {elNameVersion}
      {elHash}
    </div>
  );

  return (
    <div style={css(styles.base, props.style)}>
      {elBody}
      {elPkg}
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  digest(dist?: t.DistPkg) {
    const digest = wrangle.fmtHash(dist?.hash.digest);
    const b = dist?.size.bytes;
    const bytes = Str.bytes(b);
    const display = `${digest.display} (${bytes})`;
    return { ...digest, display };
  },

  fmtHash(hash?: t.StringHash) {
    const long = hash ?? '';
    const short = Hash.shorten(long, [0, 4], true);
    const tooltip = `pkg:digest:${long}`;
    const display = `pkg:sha256:#${short}`;
    return { long, short, display, tooltip };
  },
} as const;
