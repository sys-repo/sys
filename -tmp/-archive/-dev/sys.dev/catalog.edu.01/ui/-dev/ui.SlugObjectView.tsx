import React from 'react';
import { Slug } from '../../m.slug/mod.ts';
import { type t, Color, css, ObjectView } from './common.ts';

export type CatalogObjectViewProps = {
  name?: string;
  slug?: {
    value?: t.Slug | unknown;
    path?: t.ObjectPath;
    diagnostics?: t.Ary<t.Yaml.Diagnostic>;
  };
  expand?: t.ObjectViewProps['expand'];
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const SlugObjectView: React.FC<CatalogObjectViewProps> = (props) => {
  const { debug = false, slug } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  const ok = (slug?.diagnostics?.length ?? 0) === 0;
  const field = {
    def: 'def(slug)',
    ok: 'slug:ok',
    current: `slug:current:/${slug?.path?.join('/') ?? '<unknown>'}`,
    diagnostics: `slug:diagnostics`,
  };

  const data = {
    [field.def]: Slug,
    [field.ok]: ok,
    [field.current]: slug?.value,
    [field.diagnostics]: slug?.diagnostics ?? [],
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <ObjectView
        style={{ marginTop: 15 }}
        expand={props.expand}
        name={props.name ?? 'Slug'}
        data={data}
      />
    </div>
  );
};
