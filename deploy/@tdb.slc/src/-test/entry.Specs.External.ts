import { SpecsComponents, ns } from '@sys/ui-react-components/specs';
import type { t } from './common.ts';

/**
 * Samples from external libs:
 */
export const SpecsExternal = {} as t.SpecImports;
const add = (name: string) => {
  const key = `${ns}: ${name}`;
  if (key in SpecsComponents) SpecsExternal[key] = SpecsComponents[key];
};

add('Layout.CenterColumn');
