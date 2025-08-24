import { type t } from './common.ts';

import { makeValidator } from './u.validate.ts';
import { makePropsValidators, validateProps } from './u.props.ts';

export const Schema: t.FactorySchemaLib = {
  makeValidator,
  makePropsValidators,
  validateProps,
};
