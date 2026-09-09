import { MdMic, MdSpeaker, MdVideoCameraFront, MdVideocam } from 'react-icons/md';
import { Icon } from '../Icon/mod.ts';

const icon = Icon.renderer;

/**
 * Icon collection:
 */
export const Icons = {
  Video: icon(MdVideocam),
  Mic: icon(MdMic),
  Speaker: icon(MdSpeaker),
} as const;
