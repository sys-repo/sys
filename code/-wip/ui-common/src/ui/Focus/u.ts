import type { t } from '../common.ts';

export const Wrangle = {
  args(focus: boolean, el?: Element): t.FocusHandlerArgs {
    const action = focus ? 'focus' : 'blur';
    const blur = !focus;
    return { action, focus, blur, el };
  },
} as const;
