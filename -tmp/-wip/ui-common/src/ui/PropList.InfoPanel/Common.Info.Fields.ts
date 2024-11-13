import type { t } from './common.ts';

export const CommonInfoFields = {
  /**
   * Helper for toggling the root visibility switch.
   */
  visible<T extends string = string>(
    data?: t.InfoVisible<T>,
    onToggle?: t.InfoVisibleToggleHandler,
  ): t.PropListItem {
    const enabled = data?.enabled ?? true;
    const selected = data?.value ?? true;
    return {
      label: data?.label ?? 'Visible',
      value: {
        kind: 'Switch',
        enabled,
        body: selected,
        onClick() {
          onToggle?.({ prev: selected, next: !selected });
        },
      },
    };
  },
} as const;
