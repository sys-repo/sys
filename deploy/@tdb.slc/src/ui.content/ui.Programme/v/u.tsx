import { Image } from './common.ts';
export * from '../u.ts';

/**
 * Shorthand for an <Image.View>.
 */
export const image = (src: string) => {
  return <Image.View src={src} />;
};
