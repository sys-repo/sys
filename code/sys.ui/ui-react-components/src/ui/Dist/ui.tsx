import React from 'react';
import { type t, Color, css, D, KeyValue, Obj, Str } from './common.ts';

export const Dist: React.FC<t.DistProps> = (props) => {
  const { debug = false, dist } = props;

  const kv = (dist?: t.DistPkg): t.KeyValueItem[] => {
    if (!dist) return [];
    const items: t.KeyValueItem[] = [];

    items.push({ kind: 'title', v: 'DistPkg' });

    items.push({ kind: 'hr', opacity: 0.15 });

    // Core:
    items.push({ k: 'type', v: dist.type });
    items.push({ k: 'entry', v: dist.entry });
    items.push({ k: 'url.base', v: dist.url?.base });

    items.push({ kind: 'hr', opacity: 0.15 });

    // Pkg:
    items.push({ kind: 'title', v: 'pkg' });
    items.push({ k: 'name', v: dist.pkg?.name });
    items.push({ k: 'version', v: dist.pkg?.version });

    items.push({ kind: 'hr', opacity: 0.15 });

    // Build:
    items.push({ kind: 'title', v: 'build' });
    items.push({ k: 'time', v: dist.build?.time });
    items.push({ k: 'builder', v: dist.build?.builder });
    items.push({ k: 'runtime', v: dist.build?.runtime });
    items.push({ k: 'size.total', v: Str.bytes(dist.build?.size?.total) });
    items.push({ k: 'size.pkg', v: Str.bytes(dist.build?.size?.pkg) });

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
