import { type t, Center, Image, LogoWordmark } from './common.ts';
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
