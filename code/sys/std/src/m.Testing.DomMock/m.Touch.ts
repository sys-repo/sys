import { Is, type t } from './common.ts';

/**
 * Framework-neutral touch fixtures. Callers own contact lists and dispatch.
 */
export const Touch: t.DomMock.Touch.Lib = Object.freeze({
  point(init) {
    return {
      identifier: init.identifier,
      target: init.target,
      clientX: init.clientX ?? 0,
      clientY: init.clientY ?? 0,
      pageX: init.pageX ?? 0,
      pageY: init.pageY ?? 0,
      screenX: init.screenX ?? 0,
      screenY: init.screenY ?? 0,
      radiusX: init.radiusX ?? 0,
      radiusY: init.radiusY ?? 0,
      rotationAngle: init.rotationAngle ?? 0,
      force: init.force ?? 0,
    };
  },

  event(target, type, init) {
    const view = target.ownerDocument.defaultView;
    if (Is.nil(view)) throw new Error('Touch events require a target with an owning window.');
    return new view.TouchEvent(type, { bubbles: true, cancelable: true, ...init });
  },
});
