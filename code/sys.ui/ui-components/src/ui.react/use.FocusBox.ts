import { createElement, useCallback, useState } from 'react';
import { focusInk } from '../m.style/m.FocusStyle/u.controlFocus.ts';

type Box = 'inline' | 'box' | undefined;

/** A non-layout paint target exists only for an eligible, keyboard-focused control. */
export function useFocusBox(enabled: boolean) {
  const [box, setBox] = useState<Box>();
  const ref = useCallback((el: HTMLElement | null) => {
    const view = el?.ownerDocument.defaultView;
    if (!el || !view?.CSS?.supports('inset-block-start: anchor(start, 0px)')) return;
    const colors = view.matchMedia('(forced-colors: none)');
    let frame = 0;
    let previous: Box;
    const update = (next: Box) => {
      if (next === previous) return;
      previous = next;
      setBox(next);
    };
    // No fragment-change event exists. Read only while this control shows keyboard focus;
    // rerender only when its paint switches between native, inline, and block geometry.
    const measure = () => {
      frame = 0;
      if (!colors.matches || !el.matches(':focus-visible')) return update(undefined);
      const style = view.getComputedStyle(el);
      const fits = el.getClientRects().length === 1 && style.overflowX === 'visible' &&
        style.overflowY === 'visible' && !/\b(paint|content|strict)\b/.test(style.contain) &&
        (!style.contentVisibility || style.contentVisibility === 'visible') &&
        (style.anchorName === 'none' || style.anchorName === focusInk.anchor);
      update(fits ? (style.display === 'inline' ? 'inline' : 'box') : undefined);
      frame = view.requestAnimationFrame(measure);
    };
    const schedule = () => {
      if (!frame) frame = view.requestAnimationFrame(measure);
    };
    const focus = () => {
      colors.addEventListener('change', schedule);
      el.addEventListener('keydown', schedule);
      schedule();
    };
    const blur = () => {
      colors.removeEventListener('change', schedule);
      el.removeEventListener('keydown', schedule);
      view.cancelAnimationFrame(frame);
      frame = 0;
      update(undefined);
    };
    el.addEventListener('focus', focus);
    el.addEventListener('blur', blur);
    if (el.matches(':focus')) focus();
    return () => {
      el.removeEventListener('focus', focus);
      el.removeEventListener('blur', blur);
      blur();
    };
  }, []);
  const indicator = enabled && box &&
    createElement('span', { 'aria-hidden': true, [focusInk.attribute]: box });
  return { ref: enabled ? ref : undefined, indicator };
}
