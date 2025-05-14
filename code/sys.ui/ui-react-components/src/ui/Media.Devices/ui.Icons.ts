import { FaVideo } from 'react-icons/fa';
import { MdMic, MdSpeaker, MdVideoCameraFront } from 'react-icons/md';
import { Icon } from '../Icon/mod.ts';

const icon = Icon.renderer;

/**
 * Icon collection:
 */
export const Icons = {
  Video: icon(MdVideoCameraFront),
  Mic: icon(MdMic),
  Speaker: icon(MdSpeaker),
} as const;
