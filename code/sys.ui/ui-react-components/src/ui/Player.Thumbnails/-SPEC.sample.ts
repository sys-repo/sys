import { type t } from './common.ts';

const IMG = {
  KITTEN: `https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.wallpaperflare.com%2Fstatic%2F732%2F902%2F566%2Fanimal-pet-cute-grey-wallpaper.jpg&f=1&nofb=1&ipt=a69e2c104f05537e10d73517716481f2b1db71244a10fdb108b07fd6e9a01652&ipo=images`,
  LIZARD: `https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.uZCiSQquNq1uSARFRpKM8wHaEK%26pid%3DApi&f=1&ipt=ecb28ebe255e465723a38e03dd84a17cbbba3f734802b7ad12266035fabaa71d&ipo=images`,
  NOT_FOUND: '/404.png',
} as const;

export const sampleTimestamps: t.VideoTimestamps = {
  '00:00:01.000': { image: IMG.KITTEN },
  '00:00:03.123': { image: IMG.LIZARD },
  '00:00:6.001': { image: IMG.NOT_FOUND },
  '00:01:38.002': { image: IMG.NOT_FOUND },
  '00:01:60.003': { image: IMG.NOT_FOUND },
  '00:01:68.004': { image: IMG.NOT_FOUND },
  '00:02:23.000': { image: IMG.NOT_FOUND },
  '00:03:01.001': { image: IMG.LIZARD },
  '00:01:05.002': { image: IMG.KITTEN },
};
