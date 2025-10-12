import React from 'react';
import { Slug } from '../../m.slug/mod.ts';
import { type t, Color, css, D, ObjectView } from './common.ts';

export type CatalogObjectViewProps = {
  slug?: { value?: t.Slug | unknown; path?: t.ObjectPath };
  expand?: t.ObjectViewProps['expand'];
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const CatalogObjectView: React.FC<CatalogObjectViewProps> = (props) => {
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

  const slugField = `current:/${slug?.path?.join('/') ?? '<unknown>'}`;
  const data = {
    Slug,
    [slugField]: slug?.value,
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <ObjectView
        style={{ marginTop: 15 }}
        expand={props.expand}
        name={D.catalog.name}
        data={data}
      />
    </div>
  );
};
