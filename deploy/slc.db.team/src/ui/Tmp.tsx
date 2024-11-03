import { useEffect, useState, useRef, useCallback } from 'react';
import { COLORS, Color, css, Pkg, pkg, type t, rx, Path, Err } from './common.ts';

export type TmpProps = {
  theme?: t.CommonTheme;
  style?: t.CssValue;
};


const DistPkg = {
  async fetch(options: { dispose$?: t.UntilObservable; disposeReason?: any } = {}) {
    const errors = Err.errors();
    const controller = new AbortController();
    const signal = controller.signal;
    const life = rx.disposable(options.dispose$);
    life.dispose$.subscribe(() => controller.abort(options.disposeReason ?? 'disposed'));

    const url = new URL(Path.join(location.origin, 'dist.json'));
    const fetched = await fetch(url, { signal });
    let dist: t.DistPkg | undefined;

    try {
      if (fetched.ok) {
        const json = (await fetched.json()) as t.DistPkg;
        const isPkg = Pkg.Is.dist(json);
        if (isPkg) dist = json;
      } else {
        const cause = Err.std(`${fetched.status}:${fetched.text}`);
        errors.push(Err.std(`Failed while loading: ${url.href}`, { cause }));
      }
    } catch (cause: any) {
      errors.push(Err.std(`An unexpected error occures: ${url}`, { cause }));
    }

    return {
      ok: fetched.ok,
      dist,
      error: errors.toError(),
    };
  },
} as const;

export const Tmp: React.FC<TmpProps> = (props) => {
  const {} = props;
  const [dist, setDist] = useState<t.DistPkg>();
  const digest = wrangle.digest(dist);

  /**
   * Lifecycle.
   */
  useEffect(() => {
    const { dispose, dispose$ } = rx.disposable();
    (async () => {
      const res = await DistPkg.fetch({ dispose$, disposeReason: 'react:useEffect:dispose' });
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
      pig: css({ fontSize: 65 }),
      title: css({ fontSize: 28 }),
    },
    pkg: {
      base: css({ Absolute: [null, null, 6, 15], fontFamily: 'monospace', lineHeight: 1.7 }),
      name: css({}),
      at: css({ MarginX: '0.6em', opacity: 0.6 }),
      version: css({ opacity: 1 }),
      hash: css({ opacity: 0.5, color: Color.DARK }),
    },
  };

  const elBody = (
    <div {...styles.body.base}>
      <div>
        <div {...styles.body.pig}>{`🐷`}</div>
        <div {...styles.body.title}>{`Social Lean Canvas`}</div>
      </div>
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
      {digest && <div {...styles.pkg.hash}>{digest}</div>}
    </div>
  );

  return (
    <div {...css(styles.base, props.style)}>
      {elPkg}
      {elBody}
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  digest(dist?: t.DistPkg) {
    return dist?.hash.digest;
  },
} as const;
