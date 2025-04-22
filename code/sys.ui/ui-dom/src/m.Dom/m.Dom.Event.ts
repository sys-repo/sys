import { type t } from './common.ts';

export const Event: t.DomEventLib = {
  isWithin(event, match) {
    let el = event.target as Element | null;

    const isMatch = (element: Element) => {
      if (typeof match === 'function') return match({ element });
      return element.getAttribute('data-component') === match;
    };

    // Walk up the DOM tree.
    while (el) {
      if (isMatch(el)) return true;
      el = el.parentElement;
    }

    return false; // No match.
  },
};
