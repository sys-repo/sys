import type * as t from './-SPEC.t.ts';

import { PropList } from '../PropList/mod.ts';
import { Field } from './-SPEC.field.ts';
import { pkg } from './common.ts';

const fields = {
  get all(): t.InfoField[] {
    return ['Module', 'Module.Verify', 'Component'];
  },
  get default(): t.InfoField[] {
    return ['Module', 'Module.Verify'];
  },
};
export const DEFAULTS = {
  displayName: `${pkg.name}:Info`,
  query: { dev: 'dev' },
  fields,
} as const;

/**
 * Component
 */
export const Info: React.FC<t.InfoProps> = (props) => {
  const { theme, data = {} } = props;
  const fields = PropList.fields(props.fields, DEFAULTS.fields.default);
  const title = PropList.Info.title(props);

  const items = PropList.builder<t.InfoField>()
    .field('Module', () => Field.module(theme))
    .field('Module.Verify', () => Field.moduleVerify(theme))
    .field('Component', () => Field.component(data.component, theme))
    .items(fields);

  /**
   * Render
   */
  return (
    <PropList
      title={title}
      items={items}
      width={PropList.Info.width(props)}
      theme={theme}
      margin={props.margin}
      style={props.style}
    />
  );
};
