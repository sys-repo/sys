import { afterAll, beforeAll, describe, DomMock, expect, it, type t } from '../-test.ts';
import { UserHas } from '../m.Events/mod.ts';
import { Event } from './m.Dom.Event.ts';
import { Interactive } from './m.Dom.Interactive.ts';
import { Dom } from './mod.ts';

describe('Dom', () => {
  DomMock.init({ beforeAll, afterAll });

  it('API', () => {
    expect(Dom.Event).to.equal(Event);
    expect(Dom.Interactive).to.equal(Interactive);
    expect(Dom.UserHas).to.equal(UserHas);
  });

  describe('Dom.Interactive', () => {
    it('matches canonical interactive elements', () => {
      const button = document.createElement('button');
      const input = document.createElement('input');
      const link = document.createElement('a');
      link.setAttribute('href', 'https://example.com');
      const role = document.createElement('div');
      role.setAttribute('role', 'switch');

      expect(Interactive.Is.at(button)).to.eql(true);
      expect(Interactive.Is.at(input)).to.eql(true);
      expect(Interactive.Is.at(link)).to.eql(true);
      expect(Interactive.Is.at(role)).to.eql(true);
    });

    it('resolves descendants and text nodes to the closest interactive ancestor', () => {
      const button = document.createElement('button');
      const span = document.createElement('span');
      const text = document.createTextNode('press');
      span.appendChild(text);
      button.appendChild(span);

      expect(Interactive.closest(span)).to.equal(button);
      expect(Interactive.closest(text)).to.equal(button);
    });

    it('treats tabindex values consistently with the canonical selector', () => {
      const focusable = document.createElement('div');
      focusable.setAttribute('tabindex', '0');
      const skipped = document.createElement('div');
      skipped.setAttribute('tabindex', '-1');

      expect(Interactive.Is.at(focusable)).to.eql(true);
      expect(Interactive.Is.at(skipped)).to.eql(false);
    });

    it('returns false for nullish targets', () => {
      expect(Interactive.closest(null)).to.eql(undefined);
      expect(Interactive.closest(undefined)).to.eql(undefined);
      expect(Interactive.Is.at(null)).to.eql(false);
      expect(Interactive.Is.at(undefined)).to.eql(false);
    });

    it('ignores only the exact configured element', () => {
      const root = document.createElement('div');
      root.setAttribute('tabindex', '0');
      const span = document.createElement('span');
      const button = document.createElement('button');
      root.appendChild(span);
      root.appendChild(button);

      expect(Interactive.Is.at(root)).to.eql(true);
      expect(Interactive.Is.at(root, { ignore: root })).to.eql(false);
      expect(Interactive.Is.at(span, { ignore: root })).to.eql(false);
      expect(Interactive.closest(button, { ignore: root })).to.equal(button);
    });

    it('applies exact ignore semantics within boundary queries', () => {
      const boundary = document.createElement('div');
      boundary.setAttribute('tabindex', '0');
      const span = document.createElement('span');
      const button = document.createElement('button');
      boundary.appendChild(span);
      boundary.appendChild(button);

      expect(Interactive.Is.within(boundary, boundary)).to.eql(true);
      expect(Interactive.Is.within(boundary, boundary, { ignore: boundary })).to.eql(false);
      expect(Interactive.Is.within(span, boundary, { ignore: boundary })).to.eql(false);
      expect(Interactive.Is.within(button, boundary, { ignore: boundary })).to.eql(true);
    });

    it('does not leak an interactive ancestor from outside the boundary', () => {
      const button = document.createElement('button');
      const boundary = document.createElement('span');
      const child = document.createElement('em');
      boundary.appendChild(child);
      button.appendChild(boundary);

      expect(Interactive.closest(child)).to.equal(button);
      expect(Interactive.Is.within(child, boundary)).to.eql(false);
    });

    it('checks whether an interactive target is within a boundary', () => {
      const boundary = document.createElement('div');
      const outside = document.createElement('div');
      const button = document.createElement('button');
      const outsideButton = document.createElement('button');
      boundary.appendChild(button);
      outside.appendChild(outsideButton);

      expect(Interactive.Is.within(button, boundary)).to.eql(true);
      expect(Interactive.Is.within(outsideButton, boundary)).to.eql(false);
    });
  });

  describe('Dom.Event', () => {
    const toEvent = (target?: Element | null) => ({ target }) as unknown as globalThis.Event;

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
      const matchFn: t.Dom.Walk.Filter = (e) => e.element === el;
      expect(Event.isWithin(event, matchFn)).to.be.true;
    });

    it('uses a custom match function and returns true when it matches an ancestor', () => {
      const parent = document.createElement('div');
      const child = document.createElement('span');
      parent.appendChild(child);

      const event = toEvent(child);
      const matchFn: t.Dom.Walk.Filter = (e) => e.element === parent;
      expect(Event.isWithin(event, matchFn)).to.be.true;
    });

    it('returns false if the custom match function always returns false (even if attr matches)', () => {
      const el = document.createElement('div');
      el.setAttribute('data-component', 'foo');

      const event = toEvent(el);
      const matchFn: t.Dom.Walk.Filter = (e) => false;
      expect(Event.isWithin(event, matchFn)).to.be.false;
    });

    it('returns false when event.target is null', () => {
      expect(Event.isWithin(toEvent(null), 'anything')).to.be.false;
      expect(Event.isWithin(toEvent(undefined), 'anything')).to.be.false;
    });
  });
});
