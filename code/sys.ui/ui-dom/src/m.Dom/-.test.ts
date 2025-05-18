import { type t, describe, DomMock, expect, it } from '../-test.ts';
import { Event } from './m.Dom.Event.ts';
import { Dom } from './mod.ts';

describe(
  'Dom',
  /** NB: leaked timers left around by the "happy-dom" module. */ {
    sanitizeOps: false,
    sanitizeResources: false,
  },
  () => {
    it('(polyfill)', () => DomMock.polyfill());

    it('API', () => {
      expect(Dom.Event).to.equal(Event);
    });

    describe('Dom.Event', () => {
      const toEvent = (target?: Element | null) => ({ target } as unknown as Event);

      it('returns true when the target element has the matching data-component attribute', () => {
        const el = document.createElement('div');
        el.setAttribute('data-component', 'foo');

        const event = toEvent(el);
        expect(Event.isWithin(event, 'foo')).to.be.true;
      });

      it('returns true when an ancestor element has the matching data-component attribute', () => {
        const parent = document.createElement('div');
        const child = document.createElement('span');
        parent.setAttribute('data-component', 'parent');
        parent.appendChild(child);

        const event = toEvent(child);
        expect(Event.isWithin(event, 'parent')).to.be.true;
      });

      it('returns false when no element in the tree has the matching attribute', () => {
        const parent = document.createElement('div');
        const child = document.createElement('span');
        parent.appendChild(child);

        const event = toEvent(child);
        expect(Event.isWithin(event, 'bar')).to.be.false;
      });

      it('uses a custom match function and returns true when it matches the target', () => {
        const el = document.createElement('div');
        const event = toEvent(el);
        const matchFn: t.DomWalkFilter = (e) => e.element === el;
        expect(Event.isWithin(event, matchFn)).to.be.true;
      });

      it('uses a custom match function and returns true when it matches an ancestor', () => {
        const parent = document.createElement('div');
        const child = document.createElement('span');
        parent.appendChild(child);

        const event = toEvent(child);
        const matchFn: t.DomWalkFilter = (e) => e.element === parent;
        expect(Event.isWithin(event, matchFn)).to.be.true;
      });

      it('returns false if the custom match function always returns false (even if attr matches)', () => {
        const el = document.createElement('div');
        el.setAttribute('data-component', 'foo');

        const event = toEvent(el);
        const matchFn: t.DomWalkFilter = (e) => false;
        expect(Event.isWithin(event, matchFn)).to.be.false;
      });

      it('returns false when event.target is null', () => {
        expect(Event.isWithin(toEvent(null), 'anything')).to.be.false;
        expect(Event.isWithin(toEvent(undefined), 'anything')).to.be.false;
      });
    });
  },
);
