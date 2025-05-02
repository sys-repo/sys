import { type t, Center, Image, Player } from './common.ts';

/**
 * Standard video/media configuration setup.
 */
export const v = (src: string) => {
  return Player.Video.signals({
    src,
    fadeMask: 15,
    scale: (e) => e.enlargeBy(2),
  });
};

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
