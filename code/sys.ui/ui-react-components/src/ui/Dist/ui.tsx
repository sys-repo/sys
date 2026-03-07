import React from 'react';
import { type t, Color, css, D, Icons, KeyValue, Str } from './common.ts';

export type DistProps = {
  dist?: t.DistPkg;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const Dist: React.FC<DistProps> = (props) => {
  const { debug = false, dist } = props;

  const kv = (dist?: t.DistPkg): t.KeyValueItem[] => {
    if (!dist) return [];
    const items: t.KeyValueItem[] = [];
    const hr = () => items.push({ kind: 'hr', opacity: 0.15 });
    const ellipsize = Str.ellipsize;

    const elTitle = (
      <div className={css({ display: 'flex', columnGap: 8 }).class}>
        {elPkg} <span>{'DistPkg'} </span>{' '}
      </div>
    );

    items.push({ kind: 'title', v: elTitle });
    hr();

    // Pkg:
    items.push({ k: 'name', v: dist.pkg?.name });
    items.push({ k: 'version', v: dist.pkg?.version });
    hr();

    // Core:
    items.push({ k: 'type', v: ellipsize(dist.type, [20, 12], '..') });
    hr();

    // Build:
    items.push({ kind: 'title', v: 'build' });
    items.push({ k: 'time', v: dist.build?.time });
    items.push({ k: 'builder', v: dist.build?.builder });
    items.push({ k: 'runtime', v: ellipsize(dist.build?.runtime ?? '', [20, 16], '..') });
    items.push({ k: 'size.total', v: Str.bytes(dist.build?.size?.total) });
    items.push({ k: 'size.pkg', v: Str.bytes(dist.build?.size?.pkg) });

    if (dist.hash.digest) {
      hr();
      items.push({ k: 'hash.digest', v: ellipsize(dist.hash.digest, [12, 5], '..') });
    }

    return items;
  };

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 10,
    }),
    icon: css({
      width: 14,
      height: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
  };

  const elPkg = (
    <div className={css(styles.icon).class}>
      <Icons.Object size={16} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <KeyValue.UI theme={theme.name} items={kv(dist)} mono={true} />
    </div>
  );
};
