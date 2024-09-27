import { Pkg } from '../common.ts';

/**
 * Sample Component.
 */
export const Foo = () => {
  const text = `${Pkg.name}@${Pkg.version}:Foo`;
  return <div>{text}</div>;
};
