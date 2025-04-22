import { ns as ReactComponents, SpecsComponents } from '@sys/ui-react-components/specs';
import type { t } from './common.ts';

const Ns = {
  local: 'sys.ui.components',
  ReactComponents,
};

/**
 * Samples from external libs:
 */
export const SpecsExternal = {} as t.SpecImports;
const add = (name: string) => {
  const external = `${Ns.ReactComponents}: ${name}`;
  const local = `${Ns.local}: ${name}`;
  if (external in SpecsComponents) SpecsExternal[local] = SpecsComponents[external];
};

add('Layout.CenterColumn');
