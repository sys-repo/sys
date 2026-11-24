import { GrCircleAlert, GrInfo, GrStatusWarning } from 'react-icons/gr';
import { LuBook } from 'react-icons/lu';
import { PiMegaphoneBold } from 'react-icons/pi';
import { Icon } from '../Icon/mod.ts';
import type { t } from './common.ts';

export const Icons = {
  note: Icon.renderer(LuBook),
  tip: Icon.renderer(GrInfo),
  important: Icon.renderer(PiMegaphoneBold),
  caution: Icon.renderer(GrCircleAlert),
  warning: Icon.renderer(GrStatusWarning),
} as const satisfies Record<t.Admonition.Kind, ReturnType<typeof Icon.renderer>>;
