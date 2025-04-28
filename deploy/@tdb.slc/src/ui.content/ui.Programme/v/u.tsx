import { type t, Center, Image, dirPath } from './common.ts';
export * from '../u.ts';

/**
 * Path directory:
 */
export const Dir = {
  programme: dirPath('/images/ui.Programme'),
} as const;

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
