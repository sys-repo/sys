import { MdFace } from 'react-icons/md';
import { Icons as Base, icon } from '../ui/ui.Icons.ts';

/**
 * Icon collection:
 */
export const Icons = {
  ...Base,
  Face: icon(MdFace),
} as const;
