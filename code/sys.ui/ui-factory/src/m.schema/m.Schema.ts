import { type t } from './common.ts';

import { makePropsValidators, validateProps } from './u.props.ts';
import { makeValidator } from './u.validate.ts';

const Props: t.SchemaPropsLib = {
  makeValidators: makePropsValidators,
  validate: validateProps,
};

export const Schema: t.SchemaLib = {
  Props,
  makeValidator,
};
