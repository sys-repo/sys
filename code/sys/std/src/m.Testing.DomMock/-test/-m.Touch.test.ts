import { afterEach, beforeEach, describe, expect, it } from '../../-test.ts';
import { DomMock } from '../mod.ts';

const eventTypes = ['touchstart', 'touchmove', 'touchend', 'touchcancel'] as const;

describe('DomMock.Touch', () => {
  DomMock.init({ beforeEach, afterEach });

  it('point init → complete touch data without inferred coordinates', () => {
    const target = document.createElement('button');
    const point = DomMock.Touch.point({ identifier: 7, target, clientX: 20 });

    expect(point).to.eql({
      identifier: 7,
      target,
      clientX: 20,
      clientY: 0,
      pageX: 0,
      pageY: 0,
      screenX: 0,
      screenY: 0,
      radiusX: 0,
      radiusY: 0,
      rotationAngle: 0,
      force: 0,
    });
    expect(point.target).to.equal(target);
  });

  it('explicit point fields → preserved without changing the input', () => {
    const target = document.createElement('button');
    const init: TouchInit = {
      identifier: 0,
      target,
      clientX: 10,
      clientY: 20,
      pageX: 30,
      pageY: 40,
      screenX: 50,
      screenY: 60,
      radiusX: 2,
      radiusY: 3,
      rotationAngle: 45,
      force: 0.5,
    };
    Object.freeze(init);
    const point = DomMock.Touch.point(init);

    expect(point).to.eql(init);
    expect(point).not.to.equal(init);
  });

  for (const type of eventTypes) {
    it(`${type} construction → bubbling, cancelable event with empty lists`, () => {
      const target = document.createElement('button');
      const view = target.ownerDocument.defaultView!;
      const event = DomMock.Touch.event(target, type);

      expect(event).to.be.instanceof(view.TouchEvent);
      expect(event.type).to.eql(type);
      expect(event.bubbles).to.eql(true);
      expect(event.cancelable).to.eql(true);
      expect(event.touches.length).to.eql(0);
      expect(event.targetTouches.length).to.eql(0);
      expect(event.changedTouches.length).to.eql(0);
      expect(event.target).to.eql(null); // Construction does not dispatch.
    });
  }

  it('multiple contacts → each caller-supplied list keeps its own membership', () => {
    const target = document.createElement('button');
    const other = document.createElement('div');
    const first = DomMock.Touch.point({ identifier: 1, target });
    const second = DomMock.Touch.point({ identifier: 2, target: other });
    const ended = DomMock.Touch.point({ identifier: 3, target });
    const event = DomMock.Touch.event(target, 'touchend', {
      touches: [first, second],
      targetTouches: [first],
      changedTouches: [ended],
    });

    expect(Array.from(event.touches)).to.eql([first, second]);
    expect(Array.from(event.targetTouches)).to.eql([first]);
    expect(Array.from(event.changedTouches)).to.eql([ended]);
    expect(event.touches[0]).to.equal(first);
    expect(event.touches[1]).to.equal(second);
    expect(event.changedTouches[0]).to.equal(ended);
  });

  it('end/cancel → caller supplies released contacts without retained gesture state', () => {
    const target = document.createElement('button');
    const point = DomMock.Touch.point({ identifier: 1, target });
    DomMock.Touch.event(target, 'touchstart', {
      touches: [point],
      targetTouches: [point],
      changedTouches: [point],
    });

    for (const type of ['touchend', 'touchcancel'] as const) {
      const event = DomMock.Touch.event(target, type, { changedTouches: [point] });
      expect(event.touches.length).to.eql(0);
      expect(event.targetTouches.length).to.eql(0);
      expect(Array.from(event.changedTouches)).to.eql([point]);
    }

    const fresh = DomMock.Touch.event(target, 'touchstart');
    expect(fresh.touches.length).to.eql(0);
    expect(fresh.changedTouches.length).to.eql(0);
  });

  it('construction → explicit dispatch bubbles and reports cancellation', () => {
    const parent = document.createElement('div');
    const target = document.createElement('button');
    parent.append(target);
    const seen: Event[] = [];
    parent.addEventListener('touchstart', (event) => {
      seen.push(event);
      event.preventDefault();
    });

    const event = DomMock.Touch.event(target, 'touchstart');
    expect(seen).to.eql([]);
    expect(target.dispatchEvent(event)).to.eql(false);
    expect(seen).to.eql([event]);
    expect(event.defaultPrevented).to.eql(true);
    expect(event.target).to.equal(target);
  });

  it('native init overrides → nonbubbling, noncancelable event and modifiers', () => {
    const parent = document.createElement('div');
    const target = document.createElement('button');
    parent.append(target);
    let bubbled = false;
    parent.addEventListener('touchmove', () => (bubbled = true));
    target.addEventListener('touchmove', (event) => event.preventDefault());
    const event = DomMock.Touch.event(target, 'touchmove', {
      bubbles: false,
      cancelable: false,
      composed: true,
      ctrlKey: true,
      altKey: true,
      metaKey: true,
      shiftKey: true,
    });

    expect(target.dispatchEvent(event)).to.eql(true);
    expect(bubbled).to.eql(false);
    expect(event.bubbles).to.eql(false);
    expect(event.cancelable).to.eql(false);
    expect(event.defaultPrevented).to.eql(false);
    expect(event.composed).to.eql(true);
    expect(event.ctrlKey).to.eql(true);
    expect(event.altKey).to.eql(true);
    expect(event.metaKey).to.eql(true);
    expect(event.shiftKey).to.eql(true);
  });

  it('ambient window replacement → construction still uses the target realm', () => {
    const target = document.createElement('button');
    const view = target.ownerDocument.defaultView!;
    // HappyDOM shares constructors across windows; give this realm a distinct identity.
    const TouchEventBase = view.TouchEvent;
    class TargetTouchEvent extends TouchEventBase {}
    view.TouchEvent = TargetTouchEvent;
    try {
      DomMock.polyfill({ url: 'https://example.com/' });
      const next = document.createElement('button');
      const nextView = next.ownerDocument.defaultView!;

      expect(nextView).not.to.equal(view);
      const originalEvent = DomMock.Touch.event(target, 'touchstart');
      const nextEvent = DomMock.Touch.event(next, 'touchstart');
      expect(originalEvent).to.be.instanceof(TargetTouchEvent);
      expect(nextEvent).to.be.instanceof(nextView.TouchEvent);
      expect(nextEvent).not.to.be.instanceof(TargetTouchEvent);
    } finally {
      view.TouchEvent = TouchEventBase;
    }
  });

  it('teardown → fresh lifecycle does not retain the previous constructor', async () => {
    const target = document.createElement('button');
    const view = target.ownerDocument.defaultView!;
    // Distinguish the old constructor so a cached constructor cannot pass this test.
    const TouchEventBase = view.TouchEvent;
    class PreviousTouchEvent extends TouchEventBase {}
    view.TouchEvent = PreviousTouchEvent;
    try {
      const previous = DomMock.Touch.event(target, 'touchstart');
      expect(previous).to.be.instanceof(PreviousTouchEvent);
      await DomMock.unpolyfill();
      DomMock.polyfill();
      const fresh = document.createElement('button');
      const freshView = fresh.ownerDocument.defaultView!;
      const event = DomMock.Touch.event(fresh, 'touchstart');

      expect(freshView).not.to.equal(view);
      expect(event).to.be.instanceof(freshView.TouchEvent);
      expect(event).not.to.be.instanceof(PreviousTouchEvent);
    } finally {
      view.TouchEvent = TouchEventBase;
    }
  });

  it('document without a window → explicit construction error', () => {
    const detached = document.implementation.createHTMLDocument();
    const target = detached.createElement('button');
    expect(target.ownerDocument.defaultView).to.eql(null);
    const fn = () => DomMock.Touch.event(target, 'touchstart');
    expect(fn).to.throw('Touch events require a target with an owning window.');
  });
});
