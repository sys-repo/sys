import type { t } from './common.ts';

import { makePropsValidators, validateProps } from './u.props.ts';
import { fromRegs } from './u.types.fromRegs.ts';
import { makeValidator } from './u.validate.ts';

const Types: t.SchemaTypesLib = {
  fromRegs,
};

const Props: t.SchemaPropsLib = {
  makeValidators: makePropsValidators,
  validate: validateProps,
};

export const Schema: t.SchemaLib = {
  Props,
  Types,
  makeValidator,
};
