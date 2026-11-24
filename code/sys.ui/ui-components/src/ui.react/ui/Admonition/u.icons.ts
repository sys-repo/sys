import { GrInfo } from 'react-icons/gr';
import { LuCircleDashed } from 'react-icons/lu';
import { Icon } from '../Icon/mod.ts';

export const Icons = {
  Tip: Icon.renderer(GrInfo),
  Unassigned: Icon.renderer(LuCircleDashed),
} as const;
