import { type t } from './common.ts';

import { SchemasUtil } from './m.Util.Schemas.ts';
import { makePropsValidators, validateProps } from './u.props.ts';
import { makeValidator } from './u.validate.ts';

const Props: t.SchemaPropsLib = {
  makeValidators: makePropsValidators,
  validate: validateProps,
};

const Schemas = SchemasUtil;

export const Schema: t.SchemaLib = {
  Props,
  Schemas,
  makeValidator,
};
