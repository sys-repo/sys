import { MdFace } from 'react-icons/md';
import { RiEmotionSadLine } from 'react-icons/ri';
import { Icons as Base, icon } from '../ui/ui.Icons.ts';

/**
 * Icon collection:
 */
export const Icons = {
  ...Base,
  Face: icon(MdFace),
  Sad: icon(RiEmotionSadLine),
} as const;
