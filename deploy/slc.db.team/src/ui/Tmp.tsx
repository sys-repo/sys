import { useEffect, useState } from 'react';
import { type t, Color, COLORS, css, Hash, Pkg, pkg, rx } from './common.ts';

export type TmpProps = {
  digest?: t.StringHash;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

export const Tmp: React.FC<TmpProps> = (props) => {
  const [dist, setDist] = useState<t.DistPkg>();
  const digest = props.digest ? wrangle.format(props.digest) : wrangle.digest(dist);

  /**
   * Lifecycle.
   */
  useEffect(() => {
    const { dispose, dispose$ } = rx.disposable();
    (async () => {
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
      base: css({ Absolute: 0, display: 'grid', placeItems: 'center' }),
      inner: css({ marginBottom: '5%' }),
      pig: css({ fontSize: 50 }),
      title: css({ fontSize: 28 }),
    },
    pkg: {
      base: css({
        Absolute: [null, null, 7, digest.display ? 18 : 15],
        fontFamily: 'monospace',
        lineHeight: 1.7,
        cursor: 'pointer',
      }),
      name: css({}),
      at: css({ MarginX: '0.6em', opacity: 0.6 }),
      version: css({ opacity: 1 }),
      hash: css({ opacity: 0.5, color: Color.DARK }),
    },
  };

  const elBody = (
    <div {...styles.body.base}>
      <div {...styles.body.inner}>
        <div {...styles.body.pig}>{`🐷`}</div>
        <div {...styles.body.title}>{`Social Lean Canvas`}</div>
      </div>
    </div>
  );

  const elHash = digest.display && (
    <div {...styles.pkg.hash} title={digest.tooltip}>
      {digest.display}
    </div>
  );

  const elPkg = (
    <div {...styles.pkg.base}>
      <div>
        <div>
          <span {...styles.pkg.name}>{pkg.name}</span>
          <span {...styles.pkg.at}>{'@'}</span>
          <span {...styles.pkg.version}>{pkg.version}</span>
        </div>
      </div>
      {digest.display && elHash}
    </div>
  );

  return (
    <div {...css(styles.base, props.style)}>
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
    return wrangle.format(dist?.hash.digest);
  },

  format(hash?: t.StringHash) {
    const long = hash ?? '';
    const short = Hash.shorten(long, 4, true);
    const tooltip = `pkg:digest:${long}`;
    const display = `pkg:sha256:#${short}`;
    return { long, short, display, tooltip };
  },
} as const;
