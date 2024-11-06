import { DEFAULTS, Time } from '../common.ts';
export type EscapeAction = 'ReloadRootUrl';

export const KeyboardActions = {
  /**
   * Apply "escape key" trigger action.
   */
  async onDoubleEscape(action?: EscapeAction | null) {
    if (action === 'ReloadRootUrl') {
      /**
       * Load the root URL.
       */
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const namespace = params.get(DEFAULTS.qs.dev) ?? '';

      params.set(DEFAULTS.qs.dev, 'true');
      if (namespace && namespace !== 'true') params.set(DEFAULTS.qs.selected, namespace); // NB: hint to load with current selection.

      window.history.pushState({}, '', url.href);
      await Time.delay(0, () => window.location.reload());
    }
  },
};
