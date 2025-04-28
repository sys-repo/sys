import { type t, Center, Image, Path } from './common.ts';
export * from '../u.ts';

/**
 * Shorthand for an <Image.View>
 */
export const image = (src: string) => {
  return <Image.View src={src} />;
};

/**
 * Center an element within Main panel.
 */
export const center = (el: t.ReactNode) => {
  return <Center>{el}</Center>;
};

/**
 * Curry a directory path.
 */
export const makeDir = (...dir: string[]) =>
  ({
    dir: (path: string) => makeDir(...dir, path),
    path: (path: string) => Path.join(...dir, path),
    toString: () => dir,
  } as const);

/**
 * Path directory:
 */
export const Dir = {
  programme: makeDir('/images/ui.Programme'),
} as const;
