import React from 'react';
import { type t, Color, css, KeyValue, Str } from './common.ts';

export const Dist: React.FC<t.DistProps> = (props) => {
  const { debug = false, dist } = props;

  const kv = (dist?: t.DistPkg): t.KeyValueItem[] => {
    if (!dist) return [];
    const items: t.KeyValueItem[] = [];
    const hr = () => items.push({ kind: 'hr', opacity: 0.15 });
    const ellipsize = Str.ellipsize;

    items.push({ kind: 'title', v: 'DistPkg' });
    hr();

    // Core:
    items.push({ k: 'type', v: ellipsize(dist.type, [20, 12], '..') });
    items.push({ k: 'entry', v: dist.entry });
    items.push({ k: 'url.base', v: dist.url?.base });
    hr();

    // Pkg:
    items.push({ kind: 'title', v: 'pkg' });
    items.push({ k: 'name', v: dist.pkg?.name });
    items.push({ k: 'version', v: dist.pkg?.version });
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
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.View theme={theme.name} items={kv(dist)} mono={true} />
    </div>
  );
};
